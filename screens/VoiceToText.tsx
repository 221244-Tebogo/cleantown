import Voice from '@react-native-voice/voice';
import React, { useState } from 'react';
import { Button, Share, StyleSheet, Text, View } from 'react-native';

export default function VoiceToTextShare() {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      await Voice.start('en-US');
      Voice.onSpeechResults = (result) => {
        const spokenText = result.value[0];
        setText(spokenText);
      };
    } catch (e) {
      console.error('Start Error:', e);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (e) {
      console.error('Stop Error:', e);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: text || 'No message to share yet.',
      });
    } catch (error) {
      console.error('Share Error:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Speak and Share</Text>

      <Button
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={isRecording ? stopRecording : startRecording}
      />

      <Text style={styles.transcription}>{text}</Text>

      {text ? (
        <Button title="Share Message" onPress={handleShare} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  transcription: { marginVertical: 20, fontSize: 18, color: '#333' },
});
