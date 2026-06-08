import 'package:meta/meta.dart';

@immutable
abstract class PassengerState {}

class PassengerIdle extends PassengerState {}

class PassengerLoading extends PassengerState {}

class TripSearching extends PassengerState {
  final String jobId;
  TripSearching(this.jobId);
}

class DriverAssigned extends PassengerState {
  final String jobId;
  final Map<String, dynamic> driver;
  final double etaMinutes;
  DriverAssigned({required this.jobId, required this.driver, required this.etaMinutes});
}

class TripInProgress extends PassengerState {
  final String jobId;
  final double driverLat;
  final double driverLng;
  final double etaMinutes;
  final double distanceRemainingKm;

  TripInProgress({
    required this.jobId,
    required this.driverLat,
    required this.driverLng,
    required this.etaMinutes,
    required this.distanceRemainingKm,
  });
}

class TripCompletedState extends PassengerState {
  final String jobId;
  final double amount;
  final double distanceKm;
  final double durationMinutes;

  TripCompletedState({
    required this.jobId,
    required this.amount,
    required this.distanceKm,
    required this.durationMinutes,
  });
}

class PassengerError extends PassengerState {
  final String message;
  PassengerError(this.message);
}
