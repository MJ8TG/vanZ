import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:vanz_mobile/core/services/supabase_service.dart';
import 'package:vanz_mobile/features/driver/bloc/driver_event.dart';
import 'package:vanz_mobile/features/driver/bloc/driver_state.dart';

class DriverBloc extends Bloc<DriverEvent, DriverState> {
  final SupabaseService _supabaseService = SupabaseService();
  Timer? _gpsTimer;

  DriverBloc() : super(DriverOffline()) {
    on<ToggleOnlineStatus>((event, emit) async {
      emit(DriverLoading());
      try {
        final user = _supabaseService.currentUser;
        if (user == null) throw Exception("Auth session missing");

        // Toggle user.is_online
        await _supabaseService.client
            .from('users')
            .update({
              'is_online': event.isOnline,
              'last_online_at': DateTime.now().toIso8601String(),
            })
            .eq('id', user.id);

        if (event.isOnline) {
          emit(DriverOnlineSearching());
          // Start simulated incoming notification stream check
        } else {
          _gpsTimer?.cancel();
          emit(DriverOffline());
        }
      } catch (e) {
        emit(DriverError(e.toString()));
      }
    });

    on<AcceptIncomingTrip>((event, emit) async {
      emit(DriverLoading());
      try {
        final user = _supabaseService.currentUser;
        if (user == null) throw Exception("Auth session missing");

        // Call Accept API route or DB update to link driver accepted bid
        final response = await _supabaseService.client
            .from('jobs')
            .update({
              'status': 'in_progress', // State Machine status transition
            })
            .eq('id', event.jobId)
            .select()
            .single();

        emit(NavigatingToPickup(
          jobId: event.jobId,
          passengerName: 'Sami K.',
          pickupAddress: response['pickup_address'],
          etaMinutes: 8.0,
        ));

        // Start GPS sync location broadcast interval (P0 requirement: Connect GPS hooks -> driver_locations)
        _gpsTimer?.cancel();
        _gpsTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
          try {
            // Mock driver movement coordinate updates
            await _supabaseService.client.from('driver_locations').upsert({
              'driver_id': user.id,
              'job_id': event.jobId,
              'lat': 36.8065 + (timer.tick * 0.0001),
              'lng': 10.1815 + (timer.tick * 0.0001),
              'heading': 45.0,
              'speed': 12.0,
              'accuracy': 5.0,
              'updated_at': DateTime.now().toIso8601String(),
            });
          } catch (e) {
            print("Location broadcast err: $e");
          }
        });

      } catch (e) {
        emit(DriverError(e.toString()));
      }
    });

    on<UpdateTripMilestone>((event, emit) async {
      try {
        final user = _supabaseService.currentUser;
        if (user == null) return;

        if (event.status == 'arrived') {
          emit(WaitingAtPickup(jobId: event.jobId, waitSeconds: 0));
        } else if (event.status == 'in_progress') {
          emit(CompletingTrip(event.jobId));
        }
      } catch (e) {
        emit(DriverError(e.toString()));
      }
    });

    on<ConfirmDeliveryProof>((event, emit) async {
      emit(DriverLoading());
      try {
        final user = _supabaseService.currentUser;
        if (user == null) throw Exception("Auth session missing");

        // Stop GPS watch updates
        _gpsTimer?.cancel();

        // Complete job via API / Service logic trigger
        await _supabaseService.client
            .from('jobs')
            .update({
              'status': 'completed',
              'delivery_photo_url': event.photoUrl,
              'delivery_photo_lat': event.lat,
              'delivery_photo_lng': event.lng,
            })
            .eq('id', event.jobId);

        add(RefreshEarnings());
      } catch (e) {
        emit(DriverError(e.toString()));
      }
    });

    on<RefreshEarnings>((event, emit) async {
      emit(DriverLoading());
      try {
        final user = _supabaseService.currentUser;
        if (user == null) throw Exception("Auth session missing");

        final profile = await _supabaseService.client
            .from('users')
            .select('credit_balance')
            .eq('id', user.id)
            .single();

        final transactions = await _supabaseService.client
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { 'ascending': false });

        emit(EarningsRecap(
          availableBalanceTnd: (profile['credit_balance'] ?? 0.0) / 1000,
          history: List<Map<String, dynamic>>.from(transactions ?? []),
        ));
      } catch (e) {
        emit(DriverError(e.toString()));
      }
    });
  }

  @override
  Future<void> close() {
    _gpsTimer?.cancel();
    return super.close();
  }
}
