import { useLocalSearchParams } from 'expo-router';
import ChatThread from '@/components/chat/ChatThread';

export default function ClientChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChatThread conversationId={id} userType="client" />;
}
