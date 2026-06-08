import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:vanz_mobile/core/services/supabase_service.dart';
import 'package:vanz_mobile/features/passenger/bloc/passenger_event.dart';
import 'package:vanz_mobile/features/passenger/bloc/passenger_state.dart';

class PassengerBloc extends Bloc<PassengerEvent, PassengerState> {
  final SupabaseService _supabaseService = SupabaseService();
  RealtimeChannel? _channel;

  PassengerBloc() : super(PassengerIdle()) {
    on<CreateTripRequest>((event, emit) async {
      emit(PassengerLoading());
      try {
        final user = _supabaseService.currentUser;
        if (user == null) throw Exception("Auth session missing");

        // Insert job record (State Machine: 'open')
        final response = await _supabaseService.client
            .from('jobs')
            .insert({
              'client_id': user.id,
              'service_type': 'Express',
              'pickup_address': event.pickupAddress,
              'pickup_lat': event.pickupLat,
              'pickup_lng': event.pickupLng,
              'dropoff_address': event.dropoffAddress,
              'dropoff_lat': event.dropoffLat,
              'dropoff_lng': event.dropoffLng,
              'status': 'open',
            })
            .select()
            .single();

        final jobId = response['id'];
        emit(TripSearching(jobId));

        // Start Realtime state sync subscription
        add(SubscribeToTripUpdates(jobId));
      } catch (e) {
        emit(PassengerError(e.toString()));
      }
    });

    on<SubscribeToTripUpdates>((event, emit) async {
      _channel?.unsubscribe();

      // Listen to specific job update to trigger state changes dynamically
      _channel = _supabaseService.client
          .channel('public:jobs:id=eq.${event.jobId}')
          .onPostgresChanges(
            event: PostgresChangeEvent.update,
            schema: 'public',
            table: 'jobs',
            filter: 'id=eq.${event.jobId}',
            callback: (payload) async {
              final newRecord = payload.newRecord;
              final status = newRecord['status'] as String;

              if (status == 'matched' || status == 'in_progress_to_pickup' || status == 'arrived_pickup') {
                // Fetch driver details joined
                final bidId = newRecord['accepted_bid_id'];
                if (bidId != null) {
                  final bid = await _supabaseService.client
                      .from('bids')
                      .select('driver_id')
                      .eq('id', bidId)
                      .single();

                  final driverInfo = await _supabaseService.client
                      .from('users')
                      .select('first_name, last_name, phone_number, rating')
                      .eq('id', bid['driver_id'])
                      .single();

                  final driverVehicle = await _supabaseService.client
                      .from('drivers')
                      .select('vehicle_type, vehicle_plate')
                      .eq('id', bid['driver_id'])
                      .single();

                  emit(DriverAssigned(
                    jobId: event.jobId,
                    driver: {
                      'id': bid['driver_id'],
                      'name': '${driverInfo['first_name']} ${driverInfo['last_name']}',
                      'phone': driverInfo['phone_number'],
                      'rating': driverInfo['rating'] ?? 5.0,
                      'vehicle_type': driverVehicle['vehicle_type'] ?? 'van',
                      'vehicle_plate': driverVehicle['vehicle_plate'] ?? '',
                    },
                    etaMinutes: (newRecord['eta_seconds'] ?? 480) / 60,
                  ));
                }
              } else if (status == 'in_progress') {
                emit(TripInProgress(
                  jobId: event.jobId,
                  driverLat: newRecord['delivery_photo_lat'] ?? newRecord['pickup_lat'],
                  driverLng: newRecord['delivery_photo_lng'] ?? newRecord['pickup_lng'],
                  etaMinutes: (newRecord['eta_seconds'] ?? 360) / 60,
                  distanceRemainingKm: (newRecord['distance_remaining_meters'] ?? 2000) / 1000,
                ));
              } else if (status == 'completed') {
                emit(TripCompletedState(
                  jobId: event.jobId,
                  amount: (newRecord['accepted_bid_amount'] ?? 12500) / 1000,
                  distanceKm: (newRecord['distance_remaining_meters'] ?? 14200) / 1000,
                  durationMinutes: 28.0,
                ));
                _channel?.unsubscribe();
              }
            },
          );

      _channel?.subscribe();
    });

    on<CancelTripRequest>((event, emit) async {
      emit(PassengerLoading());
      try {
        await _supabaseService.client
            .from('jobs')
            .update({'status': 'cancelled'})
            .eq('id', event.jobId);

        _channel?.unsubscribe();
        emit(PassengerIdle());
      } catch (e) {
        emit(PassengerError(e.toString()));
      }
    });

    on<SubmitDriverReview>((event, emit) async {
      try {
        final user = _supabaseService.currentUser;
        if (user == null) return;

        await _supabaseService.client.from('reviews').insert({
          'job_id': event.jobId,
          'reviewer_id': user.id,
          'reviewee_id': event.driverId,
          'reviewer_type': 'client',
          'stars': event.stars,
          'comment': event.comment,
        });

        emit(PassengerIdle());
      } catch (e) {
        emit(PassengerError(e.toString()));
      }
    });
  }

  @override
  Future<void> close() {
    _channel?.unsubscribe();
    return super.close();
  }
}
