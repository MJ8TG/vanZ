import 'package:meta/meta.dart';

@immutable
abstract class DriverEvent {}

class ToggleOnlineStatus extends DriverEvent {
  final bool isOnline;
  ToggleOnlineStatus(this.isOnline);
}

class AcceptIncomingTrip extends DriverEvent {
  final String jobId;
  AcceptIncomingTrip(this.jobId);
}

class UpdateTripMilestone extends DriverEvent {
  final String jobId;
  final String status; // 'en_route', 'arrived', 'in_progress'
  UpdateTripMilestone({required this.jobId, required this.status});
}

class ConfirmDeliveryProof extends DriverEvent {
  final String jobId;
  final String photoUrl;
  final double lat;
  final double lng;

  ConfirmDeliveryProof({
    required this.jobId,
    required this.photoUrl,
    required this.lat,
    required this.lng,
  });
}

class RefreshEarnings extends DriverEvent {}
