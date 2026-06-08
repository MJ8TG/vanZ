import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:vanz_mobile/core/constants/colors.dart';
import 'package:vanz_mobile/features/shared/widgets/custom_button.dart';
import 'package:vanz_mobile/features/driver/screens/navigation_screen.dart';

class TripRequestIncomingScreen extends StatefulWidget {
  const TripRequestIncomingScreen({Key? key}) : super(key: key);

  @override
  State<TripRequestIncomingScreen> createState() => _TripRequestIncomingScreenState();
}

class _TripRequestIncomingScreenState extends State<TripRequestIncomingScreen> {
  int _secondsRemaining = 15;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 1) {
        setState(() => _secondsRemaining--);
      } else {
        _timer?.cancel();
        if (mounted) Navigator.of(context).pop();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.navy,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 20),
              // Expiry Countdown Timer
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 90,
                    height: 90,
                    child: CircularProgressIndicator(
                      value: _secondsRemaining / 15,
                      strokeWidth: 6,
                      valueColor: const AlwaysStoppedAnimation(AppColors.yellow),
                      backgroundColor: AppColors.white.withOpacity(0.1),
                    ),
                  ),
                  Text(
                    '$_secondsRemaining',
                    style: GoogleFonts.cairo(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: AppColors.white,
                    ),
                  )
                ],
              ),
              const SizedBox(height: 32),
              Text(
                'Course Reçue !',
                style: GoogleFonts.cairo(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: AppColors.white,
                ),
              ),
              const SizedBox(height: 40),
              
              // Ticket Box info
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  children: [
                    // Pickup
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.my_location, color: AppColors.teal),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text('DÉPART', style: TextStyle(color: AppColors.darkGray, fontSize: 10, fontWeight: FontWeight.bold)),
                              SizedBox(height: 4),
                              Text('Aéroport Tunis-Carthage', style: TextStyle(color: AppColors.navy, fontWeight: FontWeight.bold, fontSize: 15)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12.0),
                      child: Divider(),
                    ),
                    // Destination
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.location_on, color: AppColors.yellow),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text('DESTINATION', style: TextStyle(color: AppColors.darkGray, fontSize: 10, fontWeight: FontWeight.bold)),
                              SizedBox(height: 4),
                              Text('La Marsa, Tunis', style: TextStyle(color: AppColors.navy, fontWeight: FontWeight.bold, fontSize: 15)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12.0),
                      child: Divider(),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text('DISTANCE', style: TextStyle(color: AppColors.darkGray, fontWeight: FontWeight.bold)),
                        Text('14.5 km', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.navy)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text('GAINS EST.",', style: TextStyle(color: AppColors.darkGray, fontWeight: FontWeight.bold)),
                        Text('12.500 TND', style: TextStyle(color: AppColors.green, fontWeight: FontWeight.w900, fontSize: 22)),
                      ],
                    )
                  ],
                ),
              ),
              const Spacer(),
              // Actions
              CustomButton(
                text: 'Accepter la course',
                backgroundColor: AppColors.teal,
                onPressed: () {
                  _timer?.cancel();
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => const DriverNavigationScreen()),
                  );
                },
              ),
              const SizedBox(height: 16),
              CustomButton(
                text: 'Refuser',
                backgroundColor: Colors.transparent,
                textColor: AppColors.red,
                onPressed: () {
                  _timer?.cancel();
                  Navigator.of(context).pop();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
