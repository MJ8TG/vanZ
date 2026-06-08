import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:vanz_mobile/core/services/supabase_service.dart';
import 'package:vanz_mobile/features/auth/bloc/auth_event.dart';
import 'package:vanz_mobile/features/auth/bloc/auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final SupabaseService _supabaseService = SupabaseService();

  AuthBloc() : super(AuthInitial()) {
    on<CheckSession>((event, emit) async {
      emit(AuthLoading());
      try {
        final session = _supabaseService.currentSession;
        if (session != null && session.user != null) {
          emit(Authenticated(session.user!));
        } else {
          emit(Unauthenticated());
        }
      } catch (e) {
        emit(AuthError(e.toString()));
      }
    });

    on<SendOtp>((event, emit) async {
      emit(AuthLoading());
      try {
        await _supabaseService.client.auth.signInWithOtp(
          phone: event.phone,
        );
        emit(OtpSentState(event.phone));
      } catch (e) {
        emit(AuthError(e.toString()));
      }
    });

    on<VerifyOtp>((event, emit) async {
      emit(AuthLoading());
      try {
        final response = await _supabaseService.client.auth.verifyOTP(
          phone: event.phone,
          token: event.otp,
          type: OtpType.sms,
        );
        if (response.user != null) {
          emit(Authenticated(response.user!));
        } else {
          emit(AuthError("Échec de l'authentification"));
        }
      } catch (e) {
        emit(AuthError(e.toString()));
      }
    });

    on<SignOut>((event, emit) async {
      emit(AuthLoading());
      try {
        await _supabaseService.client.auth.signOut();
        emit(Unauthenticated());
      } catch (e) {
        emit(AuthError(e.toString()));
      }
    });
  }
}
