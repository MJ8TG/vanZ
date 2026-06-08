import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:vanz_mobile/core/constants/colors.dart';
import 'package:vanz_mobile/features/shared/widgets/custom_button.dart';
import 'package:vanz_mobile/features/auth/screens/mode_selector_screen.dart';

class DriverEarningsScreen extends StatelessWidget {
  const DriverEarningsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightGray,
      appBar: AppBar(
        title: Text(
          'Mes Gains',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.navy),
          onPressed: () {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const ModeSelectorScreen()),
              (route) => false,
            );
          },
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Header stats block
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              decoration: const BoxDecoration(
                color: AppColors.navy,
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'SOLDE DISPONIBLE',
                    style: TextStyle(color: AppColors.iceBlue, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '180.500 TND',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 36,
                      fontWeight: FontWeight.w900,
                      color: AppColors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Commissions déduites de 12%',
                    style: TextStyle(color: AppColors.darkGray, fontSize: 12),
                  ),
                ],
              ),
            ),
            
            // Historical List of completed jobs
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'HISTORIQUE DE TRAJETS',
                      style: GoogleFonts.plusJakartaSans(
                        fontWeight: FontWeight.bold,
                        color: AppColors.darkGray,
                        fontSize: 12,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: ListView(
                        children: [
                          _buildEarningItem(
                            title: 'Transport meuble La Marsa',
                            date: 'Aujourd\'hui, 14:30',
                            price: '12.500 TND',
                          ),
                          const SizedBox(height: 12),
                          _buildEarningItem(
                            title: 'Déménagement Appartement Tunis',
                            date: 'Hier, 10:15',
                            price: '120.000 TND',
                          ),
                          const SizedBox(height: 12),
                          _buildEarningItem(
                            title: 'Livraison colis Sfax',
                            date: '05 Juin, 18:00',
                            price: '48.000 TND',
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Payout footer trigger button
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: CustomButton(
                text: 'Demander un retrait',
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Demande de retrait enregistrée (min 50 TND)')),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEarningItem({
    required String title,
    required String date,
    required String price,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 2),
          )
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.navy, fontSize: 14),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  date,
                  style: const TextStyle(color: AppColors.darkGray, fontSize: 12),
                ),
              ],
            ),
          ),
          Text(
            price,
            style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.green, fontSize: 16),
          ),
        ],
      ),
    );
  }
}
