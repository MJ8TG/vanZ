import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:vanz_mobile/core/constants/colors.dart';
import 'package:vanz_mobile/features/shared/widgets/custom_button.dart';
import 'package:vanz_mobile/features/auth/screens/mode_selector_screen.dart';

class TripCompletedScreen extends StatefulWidget {
  const TripCompletedScreen({Key? key}) : super(key: key);

  @override
  State<TripCompletedScreen> createState() => _TripCompletedScreenState();
}

class _TripCompletedScreenState extends State<TripCompletedScreen> {
  int _selectedRating = 5;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.navy,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            children: [
              const SizedBox(height: 20),
              const Icon(Icons.check_circle, color: AppColors.green, size: 80),
              const SizedBox(height: 16),
              Text(
                'Course Terminée !',
                style: GoogleFonts.cairo(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: AppColors.white,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Merci d\'avoir choisi VanZ pour votre transport.',
                style: TextStyle(color: AppColors.iceBlue, fontSize: 14),
              ),
              const Spacer(),
              // Receipt card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  children: [
                    Text(
                      'RÉCAPITULATIF',
                      style: GoogleFonts.plusJakartaSans(
                        fontWeight: FontWeight.bold,
                        color: AppColors.darkGray,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text('Distance', style: TextStyle(color: AppColors.navy, fontWeight: FontWeight.w600)),
                        Text('14.2 km', style: TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text('Durée', style: TextStyle(color: AppColors.navy, fontWeight: FontWeight.w600)),
                        Text('28 min', style: TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text('Prix payé', style: TextStyle(color: AppColors.navy, fontWeight: FontWeight.w800, fontSize: 16)),
                        Text('12.500 TND', style: TextStyle(color: AppColors.green, fontWeight: FontWeight.w900, fontSize: 20)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              // Rating Stars
              Text(
                'Évaluez votre chauffeur',
                style: GoogleFonts.plusJakartaSans(
                  color: AppColors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return IconButton(
                    icon: Icon(
                      Icons.star,
                      size: 40,
                      color: index < _selectedRating ? AppColors.yellow : AppColors.white.withOpacity(0.2),
                    ),
                    onPressed: () {
                      setState(() => _selectedRating = index + 1);
                    },
                  );
                }),
              ),
              const Spacer(),
              CustomButton(
                text: 'Terminer',
                onPressed: () {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const ModeSelectorScreen()),
                    (route) => false,
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
