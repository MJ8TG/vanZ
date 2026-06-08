import 'package:meta/meta.dart';

@immutable
abstract class DriverState {}

class DriverOffline extends DriverState {}

class DriverLoading extends DriverState {}

class DriverOnlineSearching extends DriverState {}

class IncomingTripOffer extends DriverState {
  final String jobId;
  final String pickupAddress;
  final String dropoffAddress;
  final double distanceKm;
  final double estimatedFareTnd;

  IncomingTripOffer({
    required this.jobId,
    required this.pickupAddress,
    required this.dropoffAddress,
    required this.distanceKm,
    required this.estimatedFareTnd,
  });
}

class NavigatingToPickup extends DriverState {
  final String jobId;
  final String passengerName;
  final String pickupAddress;
  final double etaMinutes;

  NavigatingToPickup({
    required this.jobId,
    required this.passengerName,
    required this.pickupAddress,
    required this.etaMinutes,
  });
}

class WaitingAtPickup extends DriverState {
  final String jobId;
  final int waitSeconds;
  WaitingAtPickup({required this.jobId, required this.waitSeconds});
}

class CompletingTrip extends DriverState {
  final String jobId;
  CompletingTrip(this.jobId);
}

class EarningsRecap extends DriverState {
  final double availableBalanceTnd;
  final List<Map<String, dynamic>> history;

  EarningsRecap({required this.availableBalanceTnd, required this.history});
}

class DriverError extends DriverState {
  final String message;
  DriverError(this.message);
}
