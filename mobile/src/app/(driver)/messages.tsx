import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import ConversationsListView from '@/components/chat/ConversationsListView';

export default function DriverMessagesScreen() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader title={t('chat.messages')} tall />
      <ConversationsListView onSelect={(conv) => router.push(`/(driver)/chat/${conv.id}`)} />
    </View>
  );
}
