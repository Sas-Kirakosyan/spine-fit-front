import type { ReactNode } from "react";
import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeftIcon } from "../components/icons/Icons";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-base font-semibold text-white mb-2">{title}</Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: string }) {
  return <Text className="text-sm text-white/60 leading-relaxed">{children}</Text>;
}

function Bullet({ children }: { children: string }) {
  return (
    <View className="flex-row mt-1">
      <Text className="text-white/60 text-sm mr-2">•</Text>
      <Text className="text-sm text-white/60 leading-relaxed flex-1">{children}</Text>
    </View>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return (
    <View className="border-l-4 border-[#e77d10] bg-[#e77d10]/10 rounded-r-xl px-4 py-3 mb-4">
      {children}
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-[#080A14]" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 rounded-full bg-white/10 items-center justify-center"
        >
          <ChevronLeftIcon size={20} color="white" />
        </Pressable>
        <Text className="flex-1 text-white text-xl font-semibold text-center mr-10">
          Privacy Policy
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48, paddingTop: 8 }}
      >
        <Text className="text-xs text-white/40 mb-6">Last updated: May 31, 2026</Text>

        <Callout>
          <Text className="text-sm text-white leading-relaxed">
            <Text className="font-semibold">Health data notice: </Text>
            SpineFit processes health-related information you provide (pain conditions, fitness level, body measurements). This data is used solely to generate your personalized workout plan and is never sold or shared with advertisers.
          </Text>
        </Callout>

        <Section title="1. Who We Are">
          <Body>
            SpineFit is an AI-assisted spine rehabilitation and fitness tracking application created by Sas Kirakosyan. For questions about this Policy, contact us at sas.kirakosian@gmail.com.
          </Body>
        </Section>

        <Section title="2. Information We Collect">
          <Text className="text-sm font-semibold text-[#e77d10] mb-1">Account Information</Text>
          <Body>When you register, we collect your email address through Supabase Authentication. We do not collect your name, phone number, or payment information.</Body>

          <Text className="text-sm font-semibold text-[#e77d10] mt-3 mb-1">Health & Body Profile</Text>
          <Body>To generate your personalized plan, we collect quiz answers including:</Body>
          <Bullet>Gender and birth year</Bullet>
          <Bullet>Diagnosed conditions: L5/S1 compression, sciatica, herniated disc</Bullet>
          <Bullet>Fitness level, equipment access, training frequency and goals</Bullet>
          <Bullet>Height and weight (stored locally on your device only)</Bullet>

          <Text className="text-sm font-semibold text-[#e77d10] mt-3 mb-1">Workout Logs</Text>
          <Body>Exercises, sets, reps, weights, pain level ratings, and session timestamps — stored in Supabase.</Body>

          <Text className="text-sm font-semibold text-[#e77d10] mt-3 mb-1">Preference Data</Text>
          <Body>Language and theme preferences — stored locally on your device only.</Body>

          <Text className="text-sm font-semibold text-[#e77d10] mt-3 mb-1">What We Do NOT Collect</Text>
          <Bullet>Location or GPS data</Bullet>
          <Bullet>Contacts, photos, or camera data</Bullet>
          <Bullet>Analytics or behavioral tracking</Bullet>
          <Bullet>Advertising identifiers</Bullet>
          <Bullet>Payment information (SpineFit is free)</Bullet>
        </Section>

        <Section title="3. How We Use Your Information">
          <Body>We use collected data exclusively to:</Body>
          <Bullet>Create and maintain your account</Bullet>
          <Bullet>Generate a personalized, spine-safe AI workout plan</Bullet>
          <Bullet>Display workout history and progress charts</Bullet>
          <Bullet>Monitor pain patterns to surface training insights</Bullet>
          <Bullet>Remember language and theme preferences</Bullet>
          <Text className="text-sm text-white/60 mt-2">
            We do not use your data for advertising or marketing to third parties.
          </Text>
        </Section>

        <Section title="4. Third-Party Services">
          <Text className="text-sm font-semibold text-[#e77d10] mb-1">Supabase</Text>
          <Body>
            Authentication and database provider. Your account data, quiz answers, workout logs, and AI plans are stored on Supabase servers (US/EU). Supabase is GDPR-compliant. See supabase.com/privacy.
          </Body>

          <Text className="text-sm font-semibold text-[#e77d10] mt-3 mb-1">Google Gemini AI</Text>
          <Body>
            Your quiz answers are sent to Google's Gemini 2.0 Flash API via our backend server to generate your workout plan. We do not share your email address or workout history with Google. See policies.google.com/privacy.
          </Body>

          <Text className="text-sm font-semibold text-[#e77d10] mt-3 mb-1">No Other Sharing</Text>
          <Body>No analytics services, advertising networks, or social login providers. We do not sell your data.</Body>
        </Section>

        <Section title="5. Data Retention">
          <Body>
            We retain your data while your account is active. When you delete your account (Settings → Danger Zone), all your data is permanently deleted from Supabase. Locally stored preferences are removed when you uninstall the app.
          </Body>
        </Section>

        <Section title="6. Your Rights">
          <Bullet>Access: Request a copy of your data</Bullet>
          <Bullet>Correction: Ask us to correct inaccurate data</Bullet>
          <Bullet>Deletion: Delete your account anytime from Settings → Danger Zone</Bullet>
          <Bullet>Portability: Request your data in a portable format</Bullet>
          <Text className="text-sm text-white/60 mt-2">
            To exercise any right, email sas.kirakosian@gmail.com. We respond within 30 days.
          </Text>
        </Section>

        <Section title="7. Data Security">
          <Body>
            All data in transit is encrypted via HTTPS/TLS. Supabase uses encryption at rest. Your records are protected by Supabase Row Level Security — only your authenticated session can access them.
          </Body>
        </Section>

        <Section title="8. Children's Privacy">
          <Body>
            SpineFit is not directed at children under 16. We do not knowingly collect data from children under 16.
          </Body>
        </Section>

        <Section title="9. International Data Transfers">
          <Body>
            Your data may be processed in the US and EU (Supabase) and in Google's infrastructure (for AI plan generation). By using SpineFit, you consent to this transfer.
          </Body>
        </Section>

        <Section title="10. Changes to This Policy">
          <Body>
            We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top. Continued use of the Service after changes constitutes acceptance of the revised Policy.
          </Body>
        </Section>

        <Section title="11. Medical Disclaimer">
          <Body>
            SpineFit is not a medical device and does not provide medical advice. AI-generated plans are informational only. Always consult your doctor before starting any exercise program.
          </Body>
        </Section>

        <Section title="12. Contact">
          <Body>Questions or concerns? Contact:</Body>
          <Text className="text-sm text-white mt-2 font-semibold">Sas Kirakosyan</Text>
          <Text className="text-xs text-white/40">Creator, SpineFit</Text>
          <Pressable onPress={() => Linking.openURL("mailto:sas.kirakosian@gmail.com").catch(() => {})}>
            <Text className="text-sm text-[#e77d10] mt-1">sas.kirakosian@gmail.com</Text>
          </Pressable>
        </Section>

        <View className="mt-2 border-t border-white/10 pt-4">
          <Text className="text-xs text-white/30 text-center">
            © 2026 SpineFit · SpineFit is not a medical device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
