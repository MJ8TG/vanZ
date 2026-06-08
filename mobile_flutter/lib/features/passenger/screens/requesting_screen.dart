import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:vanz_mobile/core/constants/colors.dart';
import 'package:vanz_mobile/features/shared/widgets/custom_button.dart';
import 'package:vanz_mobile/features/passenger/screens/assigned_screen.dart';

class RequestingScreen extends StatefulWidget {
  const RequestingScreen({Key? key}) : super(key: key);

  @override
  State<RequestingScreen> createState() => _RequestingScreenState();
}

class _RequestingScreenState extends State<RequestingScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DriverAssignedScreen()),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.navy,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              const SpinKitDoubleBounce(
                color: AppColors.teal,
                size: 100.0,
              ),
              const SizedBox(height: 48),
              Text(
                'Recherche de chauffeur...',
                style: GoogleFonts.cairo(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: AppColors.white,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Nous cherchons un transporteur disponible à proximité pour prendre en charge vos articles.',
                textAlign: Center,
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.iceBlue,
                  opacity: 0.8,
                  height: 1.5,
                ),
              ),
              const Spacer(),
              CustomButton(
                text: 'Annuler la demande',
                backgroundColor: AppColors.red.withOpacity(0.2),
                textColor: AppColors.red,
                onPressed: () {
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
