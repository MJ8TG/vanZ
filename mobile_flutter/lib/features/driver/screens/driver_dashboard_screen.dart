import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:vanz_mobile/core/constants/colors.dart';
import 'package:vanz_mobile/features/driver/screens/incoming_screen.dart';
import 'package:vanz_mobile/features/driver/screens/earnings_screen.dart';
import 'package:vanz_mobile/features/profile/screens/profile_screen.dart';

class DriverDashboardScreen extends StatefulWidget {
  const DriverDashboardScreen({Key? key}) : super(key: key);

  @override
  State<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends State<DriverDashboardScreen> {
  bool _isOnline = false;

  void _toggleOnline(bool value) {
    setState(() => _isOnline = value);
    if (_isOnline) {
      // Simulate incoming dispatch request after 4 seconds
      Future.delayed(const Duration(seconds: 4), () {
        if (mounted && _isOnline) {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const TripRequestIncomingScreen()),
          );
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Mock Map View
          Container(
            color: const Color(0xFFE8E0D8),
            child: Stack(
              children: [
                Positioned.fill(
                  child: GridPaper(
                    color: Colors.white.withOpacity(0.4),
                    divisions: 1,
                    subdivisions: 1,
                    interval: 150,
                  ),
                ),
                // Driver center location
                Center(
                  child: Icon(
                    Icons.location_history,
                    size: 48,
                    color: _isOnline ? AppColors.green : AppColors.darkGray,
                  ),
                ),
              ],
            ),
          ),
          
          // Header Status Control Bar (Status toggle: ONLINE / OFFLINE)
          Positioned(
            top: 60,
            left: 20,
            right: 20,
            child: SafeArea(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Profile button
                  GestureDetector(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const ProfileScreen()),
                      );
                    },
                    child: Container(
                      height: 48,
                      width: 48,
                      decoration: const BoxDecoration(
                        color: AppColors.white,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)],
                      ),
                      child: const Icon(Icons.person, color: AppColors.navy),
                    ),
                  ),
                  
                  // Online/Offline status badge switch
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)],
                    ),
                    child: Row(
                      children: [
                        Text(
                          _isOnline ? 'EN LIGNE' : 'HORS LIGNE',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                            color: _isOnline ? AppColors.green : AppColors.darkGray,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Switch(
                          value: _isOnline,
                          onChanged: _toggleOnline,
                          activeColor: AppColors.green,
                        ),
                      ],
                    ),
                  ),

                  // Earnings button
                  GestureDetector(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const DriverEarningsScreen()),
                      );
                    },
                    child: Container(
                      height: 48,
                      width: 48,
                      decoration: const BoxDecoration(
                        color: AppColors.white,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)],
                      ),
                      child: const Icon(Icons.account_balance_wallet, color: AppColors.navy),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Control Sheet
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              decoration: const BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
                boxShadow: [
                  BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, -5)),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 40,
                    height: 5,
                    decoration: BoxDecoration(
                      color: AppColors.lightGray,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    _isOnline ? 'Recherche de courses en cours...' : 'Passez en ligne pour recevoir des courses',
                    textAlign: Center,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.navy,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _isOnline ? 'Restez à proximité des zones animées de Tunis' : 'Vos gains s\'afficheront ici une fois en ligne',
                    textAlign: Center,
                    style: const TextStyle(fontSize: 13, color: AppColors.darkGray),
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
