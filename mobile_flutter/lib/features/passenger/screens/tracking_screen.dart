import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:vanz_mobile/core/constants/colors.dart';
import 'package:vanz_mobile/features/shared/widgets/custom_button.dart';
import 'package:vanz_mobile/features/passenger/screens/completed_screen.dart';

class LiveTrackingScreen extends StatefulWidget {
  const LiveTrackingScreen({Key? key}) : super(key: key);

  @override
  State<LiveTrackingScreen> createState() => _LiveTrackingScreenState();
}

class _LiveTrackingScreenState extends State<LiveTrackingScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const TripCompletedScreen()),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Mock Map View with simulated track
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
                // Mock Driver location
                const Center(
                  child: Icon(Icons.airport_shuttle, size: 40, color: AppColors.teal),
                ),
                // Destination point
                Positioned(
                  bottom: 350,
                  right: 100,
                  child: Column(
                    children: const [
                      Icon(Icons.location_on, size: 36, color: AppColors.yellow),
                      Text('Destination', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.navy)),
                    ],
                  ),
                )
              ],
            ),
          ),
          
          // Header status bar
          Positioned(
            top: 60,
            left: 20,
            right: 20,
            child: SafeArea(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.navy.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    const SizedBox(
                      width: 8,
                      height: 8,
                      child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(AppColors.teal)),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'En route vers votre destination',
                      style: GoogleFonts.plusJakartaSans(
                        color: AppColors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Bottom Sheet with progress and ETA
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              padding: const EdgeInsets.all(24),
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
                  // Telemetry metrics
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('ARRIVÉE ESTIMÉE', style: TextStyle(color: AppColors.darkGray, fontSize: 10, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('6 min', style: GoogleFonts.cairo(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.navy)),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('DISTANCE RESTANTE', style: TextStyle(color: AppColors.darkGray, fontSize: 10, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('3.2 km', style: GoogleFonts.cairo(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.navy)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Progress bar
                  const LinearProgressIndicator(
                    value: 0.6,
                    backgroundColor: AppColors.lightGray,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.teal),
                    minHeight: 6,
                  ),
                  const SizedBox(height: 24),
                  // Buttons panel
                  Row(
                    children: [
                      Expanded(
                        child: CustomButton(
                          text: 'Appeler',
                          backgroundColor: AppColors.yellow,
                          textColor: AppColors.navy,
                          onPressed: () {},
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: CustomButton(
                          text: 'Chat',
                          backgroundColor: AppColors.iceBlue,
                          textColor: AppColors.teal,
                          onPressed: () {},
                        ),
                      ),
                    ],
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
