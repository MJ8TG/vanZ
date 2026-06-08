import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:vanz_mobile/core/constants/colors.dart';
import 'package:vanz_mobile/features/shared/widgets/custom_button.dart';
import 'package:vanz_mobile/features/driver/screens/completion_screen.dart';

class DriverArrivalScreen extends StatefulWidget {
  const DriverArrivalScreen({Key? key}) : super(key: key);

  @override
  State<DriverArrivalScreen> createState() => _DriverArrivalScreenState();
}

class _DriverArrivalScreenState extends State<DriverArrivalScreen> {
  int _secondsElapsed = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _secondsElapsed++);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
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
              const Icon(Icons.location_on, color: AppColors.teal, size: 80),
              const SizedBox(height: 24),
              Text(
                'Arrivé au point de départ',
                style: GoogleFonts.cairo(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: AppColors.white,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Le passager a été notifié de votre arrivée. Veuillez charger les meubles en toute sécurité.',
                textAlign: Center,
                style: TextStyle(color: AppColors.iceBlue, fontSize: 14, height: 1.5),
              ),
              const Spacer(),
              // Waiting Timer
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
                decoration: BoxDecoration(
                  color: AppColors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.white.withOpacity(0.1)),
                ),
                child: Column(
                  children: [
                    const Text(
                      'TEMPS D\'ATTENTE',
                      style: TextStyle(color: AppColors.yellow, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.0),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _formatDuration(_secondsElapsed),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 40,
                        fontWeight: FontWeight.w900,
                        color: AppColors.white,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              // Actions
              CustomButton(
                text: 'Commencer le trajet',
                backgroundColor: AppColors.teal,
                onPressed: () {
                  _timer?.cancel();
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => const DriverCompletionScreen()),
                  );
                },
              ),
              const SizedBox(height: 16),
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
                      backgroundColor: AppColors.white.withOpacity(0.1),
                      textColor: AppColors.white,
                      onPressed: () {},
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
