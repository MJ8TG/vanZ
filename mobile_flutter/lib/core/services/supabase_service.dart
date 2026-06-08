import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  late final SupabaseClient client;

  Future<void> initialize({required String url, required String anonKey}) async {
    await Supabase.initialize(
      url: url,
      anonKey: anonKey,
    );
    client = Supabase.instance.client;
  }

  // Get current user session
  User? get currentUser => client.auth.currentUser;

  Session? get currentSession => client.auth.currentSession;

  // Stream of auth changes
  Stream<AuthState> get authStateChanges => client.auth.onAuthStateChange;
}
