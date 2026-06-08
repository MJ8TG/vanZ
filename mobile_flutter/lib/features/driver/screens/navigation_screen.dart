import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:vanz_mobile/core/constants/colors.dart';
import 'package:vanz_mobile/features/shared/widgets/custom_button.dart';
import 'package:vanz_mobile/features/driver/screens/arrival_screen.dart';

class DriverNavigationScreen extends StatelessWidget {
  const DriverNavigationScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Mock Navigation Map
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
                // Route line visualization
                Center(
                  child: Icon(Icons.navigation, size: 48, color: AppColors.teal.withOpacity(0.8)),
                )
              ],
            ),
          ),
          
          // Navigation top guide banner
          Positioned(
            top: 60,
            left: 20,
            right: 20,
            child: SafeArea(
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.navy,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.turn_right, color: AppColors.yellow, size: 36),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'Tournez à droite sur Rte de la Marsa',
                            style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          SizedBox(height: 4),
                          Text('Dans 300 mètres', style: TextStyle(color: AppColors.iceBlue, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Bottom Navigation info and Arrived button (🚘 5. Navigation / Active Trip Screen)
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('PASSAGER', style: TextStyle(color: AppColors.darkGray, fontSize: 10, fontWeight: FontWeight.bold)),
                          SizedBox(height: 4),
                          Text('Sami K. (Client)', style: TextStyle(color: AppColors.navy, fontWeight: FontWeight.bold, fontSize: 16)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.iceBlue,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text('8 min (4.2 km)', style: TextStyle(color: AppColors.teal, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  CustomButton(
                    text: 'Je suis arrivé au départ',
                    onPressed: () {
                      Navigator.of(context).pushReplacement(
                        MaterialPageRoute(builder: (_) => const DriverArrivalScreen()),
                      );
                    },
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
