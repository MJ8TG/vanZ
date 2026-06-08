import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:vanz_mobile/core/constants/colors.dart';
import 'package:vanz_mobile/features/auth/screens/mode_selector_screen.dart';
import 'package:vanz_mobile/features/splash/screens/splash_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Mon Profil',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            // User Avatar Card
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: AppColors.teal.withOpacity(0.1),
                    child: const Icon(Icons.person, size: 56, color: AppColors.teal),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Mohamed Ali',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AppColors.navy,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    '+216 98 765 432',
                    style: TextStyle(color: AppColors.darkGray, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            
            // Settings options list
            Text(
              'PARAMÈTRES',
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.bold,
                color: AppColors.darkGray,
                fontSize: 12,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 16),
            _buildSettingsItem(
              icon: Icons.history,
              title: 'Historique de courses',
              onTap: () {},
            ),
            const SizedBox(height: 12),
            _buildSettingsItem(
              icon: Icons.swap_horiz,
              title: 'Changer de mode',
              onTap: () {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const ModeSelectorScreen()),
                  (route) => false,
                );
              },
            ),
            const SizedBox(height: 12),
            _buildSettingsItem(
              icon: Icons.notifications,
              title: 'Notifications',
              onTap: () {},
            ),
            const SizedBox(height: 12),
            _buildSettingsItem(
              icon: Icons.security,
              title: 'Sécurité & Données',
              onTap: () {},
            ),
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 24),
            
            // Logout
            ListTile(
              leading: const Icon(Icons.logout, color: AppColors.red),
              title: const Text(
                'Déconnexion',
                style: TextStyle(color: AppColors.red, fontWeight: FontWeight.bold),
              ),
              onTap: () {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const SplashScreen()),
                  (route) => false,
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.01),
            blurRadius: 10,
            offset: const Offset(0, 2),
          )
        ],
      ),
      child: ListTile(
        leading: Icon(icon, color: AppColors.navy),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.navy, fontSize: 14),
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.darkGray),
        onTap: onTap,
      ),
    );
  }
}
