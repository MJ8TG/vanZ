# Premium UI/UX Refactoring Specification

This document provides exact, step-by-step technical instructions for overhauling the React Native Expo app's UI to a premium tier. 
**Target Agents:** Claude Code (Opus 4.8) or Gemini 3.1 Pro.

## Phase 1: Foundation (Dependencies & Config)

1. **Install Dependencies:**
   Run the following command in `mobile/`:
   ```bash
   npx expo install @expo-google-fonts/plus-jakarta-sans lucide-react-native expo-haptics
   ```

2. **Configure Tailwind (`mobile/tailwind.config.js`):**
   Update the Tailwind config to use the new font family as the default sans font:
   ```javascript
   theme: {
     extend: {
       fontFamily: {
         sans: ['"Plus Jakarta Sans"', 'sans-serif'],
       },
       // ... keep existing colors
     }
   }
   ```

3. **Global Layout (`mobile/src/app/_layout.tsx`):**
   Import the font hooks and load the fonts before rendering the app.
   ```typescript
   import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
   
   // Inside RootLayout:
   const [fontsLoaded] = useFonts({
     'Plus Jakarta Sans': PlusJakartaSans_400Regular,
     'Plus Jakarta Sans Medium': PlusJakartaSans_500Medium,
     'Plus Jakarta Sans SemiBold': PlusJakartaSans_600SemiBold,
     'Plus Jakarta Sans Bold': PlusJakartaSans_700Bold,
     'Plus Jakarta Sans ExtraBold': PlusJakartaSans_800ExtraBold,
   });
   // Prevent Splash Screen hide until fontsLoaded is true.
   ```

## Phase 2: Core Premium UI Components

Create the following files in `mobile/src/components/ui/`.

### 1. `PremiumButton.tsx`
- **Props:** `title`, `onPress`, `variant` ('primary' | 'secondary' | 'outline'), `isLoading`, `icon` (ReactNode).
- **Implementation:** 
  - Use `TouchableOpacity` with `activeOpacity={0.8}`.
  - On press, trigger `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`.
  - For 'primary', wrap the text in a `LinearGradient` (`#38B6FF` to `#2196D6`) with a `shadow-glow-teal`.
  - Use `Plus Jakarta Sans Bold` for the text.

### 2. `PremiumInput.tsx`
- **Props:** `label`, `value`, `onChangeText`, `placeholder`, `error` (string), `icon` (ReactNode), `secureTextEntry`.
- **Implementation:**
  - Wrap a `TextInput` in a `View` with a `rounded-2xl` border.
  - Track `isFocused` state. When focused, change border color to `vanz-teal` and add a subtle background tint (`bg-vanz-teal/5`).
  - If `error` is present, border becomes red and display a subtle red error text below with a `FadeIn` Reanimated transition.

### 3. `PremiumCard.tsx`
- **Implementation:**
  - A glassmorphism container using `View` with `bg-white/90` or `bg-card-glass`, `rounded-3xl`, `shadow-elevated`, and `border border-white/50`.

## Phase 3: Screen Refactoring

### 1. `mobile/src/app/welcome.tsx`
- Remove all hardcoded emojis (📦, 🚚, 🤝).
- Import `Package`, `Truck`, and `Handshake` from `lucide-react-native`.
- Render the icons inside the carousel circles with `color="#fff"` and `size={48}`.
- Replace the raw `<TouchableOpacity>` action buttons at the bottom with `<PremiumButton>`.

### 2. `mobile/src/app/auth/register.tsx`
- Replace all raw `<TextInput>` sections with `<PremiumInput>`.
- Pass appropriate Lucide icons (e.g., `User`, `Mail`, `Phone`, `Lock`) to the inputs.
- Replace the bottom submit button with `<PremiumButton>`.
- The Role Selector (Client / Chauffeur) should be styled as a floating segmented control inside a `PremiumCard` wrapper.

### 3. `mobile/src/app/auth/login.tsx`
- Apply the exact same transformation as `register.tsx` using `PremiumInput` and `PremiumButton`.

## Phase 4: Main Dashboards

Once Auth is polished:
- **`mobile/src/app/(client)/index.tsx`**: Wrap the main map overlay elements in `PremiumCard`s. Use Lucide icons for the "Where to?" search bar.
- **`mobile/src/app/(driver)/index.tsx`**: Update the online/offline toggle to a custom animated switch. Use `PremiumCard` for incoming ride requests.
