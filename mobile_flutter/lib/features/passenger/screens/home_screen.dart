import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:vanz_mobile/core/constants/colors.dart';
import 'package:vanz_mobile/features/shared/widgets/custom_button.dart';
import 'package:vanz_mobile/features/passenger/screens/requesting_screen.dart';
import 'package:vanz_mobile/features/profile/screens/profile_screen.dart';

class PassengerHomeScreen extends StatefulWidget {
  const PassengerHomeScreen({Key? key}) : super(key: key);

  @override
  State<PassengerHomeScreen> createState() => _PassengerHomeScreenState();
}

class _PassengerHomeScreenState extends State<PassengerHomeScreen> {
  final _pickupController = TextEditingController(text: 'Mon Emplacement Actuel');
  final _destinationController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Mock Map View (harmonious Bolt-styled custom map background)
          Container(
            color: const Color(0xFFE8E0D8),
            child: Stack(
              children: [
                // Custom grid lines to feel like a real map layout
                Positioned.fill(
                  child: GridPaper(
                    color: Colors.white.withOpacity(0.4),
                    divisions: 1,
                    subdivisions: 1,
                    interval: 150,
                  ),
                ),
                // Center pin for client
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.navy,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Vous êtes ici',
                          style: TextStyle(color: AppColors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const Icon(Icons.person_pin_circle, size: 48, color: AppColors.teal),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Header Search bar / location picker (📍 Top section)
          Positioned(
            top: 60,
            left: 20,
            right: 20,
            child: SafeArea(
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.navy.withOpacity(0.08),
                      blurRadius: 15,
                      offset: const Offset(0, 5),
                    )
                  ],
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.my_location, color: AppColors.teal),
                      title: TextField(
                        controller: _pickupController,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          hintText: 'Point de départ',
                        ),
                      ),
                    ),
                    const Divider(height: 1, indent: 50, endIndent: 20),
                    ListTile(
                      leading: const Icon(Icons.location_on, color: AppColors.yellow),
                      title: TextField(
                        controller: _destinationController,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          hintText: 'Où allez-vous ?',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Drawer / Profile trigger button
          Positioned(
            top: 60,
            left: 20,
            child: SafeArea(
              child: GestureDetector(
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
                    boxShadow: [
                      BoxShadow(color: Colors.black12, blurRadius: 10),
                    ],
                  ),
                  child: const Icon(Icons.person, color: AppColors.navy),
                ),
              ),
            ),
          ),

          // Sliding Bottom Sheet (📦 Bottom sheet)
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Détails de la course',
                        style: GoogleFonts.cairo(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: AppColors.navy,
                        ),
                      ),
                      const Text(
                        '12.500 TND Est.',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.green,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Paiement en espèces ou mobile. Confirmation requise.',
                    style: TextStyle(fontSize: 12, color: AppColors.darkGray),
                  ),
                  const SizedBox(height: 24),
                  CustomButton(
                    text: 'Commander un Van',
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const RequestingScreen()),
                      );
                    },
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
