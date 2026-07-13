import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { env } from '../config/env';

export const audioService = {
  recording: null as Audio.Recording | null,

  async requestPermissions() {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Microphone access is required to use voice input.');
      return false;
    }
    return true;
  },

  async startRecording() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.recording = recording;
      return recording;
    } catch (err) {
      console.error('Failed to start recording', err);
      return null;
    }
  },

  async stopRecording() {
    if (!this.recording) return null;

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      return uri;
    } catch (err) {
      console.error('Failed to stop recording', err);
      return null;
    }
  },

  // This is the integration point for Speech-to-Text services
  async transcribeAudio(uri: string): Promise<string> {
    console.log('Transcribing audio from:', uri);
    
    // Check if Whisper API key or similar is configured in env
    // const apiKey = env.OPENAI_API_KEY; 
    
    // If not configured, return a helpful placeholder
    // In production, this would perform a multipart/form-data POST to Whisper API
    
    /* Example Implementation:
    const formData = new FormData();
    formData.append('file', { uri, name: 'audio.m4a', type: 'audio/m4a' } as any);
    formData.append('model', 'whisper-1');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData,
    });
    const data = await response.json();
    return data.text;
    */

    return "[Voice Input Detected: Recording successful. Integrate Whisper API for full STT]";
  }
};
