import 'package:meta/meta.dart';

@immutable
abstract class AuthEvent {}

class CheckSession extends AuthEvent {}

class SendOtp extends AuthEvent {
  final String phone;
  SendOtp(this.phone);
}

class VerifyOtp extends AuthEvent {
  final String phone;
  final String otp;
  VerifyOtp(this.phone, this.otp);
}

class SignOut extends AuthEvent {}
