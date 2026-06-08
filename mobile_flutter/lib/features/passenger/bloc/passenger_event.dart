import 'package:meta/meta.dart';

@immutable
abstract class PassengerEvent {}

class CreateTripRequest extends PassengerEvent {
  final String pickupAddress;
  final double pickupLat;
  final double pickupLng;
  final String dropoffAddress;
  final double dropoffLat;
  final double dropoffLng;

  CreateTripRequest({
    required this.pickupAddress,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropoffAddress,
    required this.dropoffLat,
    required this.dropoffLng,
  });
}

class CancelTripRequest extends PassengerEvent {
  final String jobId;
  CancelTripRequest(this.jobId);
}

class SubscribeToTripUpdates extends PassengerEvent {
  final String jobId;
  SubscribeToTripUpdates(this.jobId);
}

class SubmitDriverReview extends PassengerEvent {
  final String jobId;
  final String driverId;
  final int stars;
  final String comment;

  SubmitDriverReview({
    required this.jobId,
    required this.driverId,
    required this.stars,
    required this.comment,
  });
}
