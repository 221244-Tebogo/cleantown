// components/AITest.tsx
import { geminiAI } from '@/services/geminiAI';

// Replace your existing testAIConnection function with this:
const testAIConnection = async () => {
  setTesting(true);
  try {
    const connectionTest = await geminiAI.testConnection();
    setResult(`Connection: ${connectionTest ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (connectionTest) {
      // Test single report analysis
      const analysis = await geminiAI.analyzeReport("Plastic bottles and food wrappers");
      setResult(prev => prev + `\nSingle Analysis: ✅ SUCCESS\nCategory: ${analysis.category}`);
      
      // Test hotspot analysis with sample data
      const sampleReports = [
        {
          location: { lat: 40.7128, lng: -74.0060 },
          timestamp: new Date().toISOString(),
          severity: 'medium',
          materials: ['plastic', 'paper'],
          category: 'dumping'
        },
        {
          location: { lat: 40.7130, lng: -74.0062 },
          timestamp: new Date().toISOString(),
          severity: 'high', 
          materials: ['plastic', 'hazardous'],
          category: 'hazard'
        }
      ];
      
      const hotspotAnalysis = await geminiAI.analyzeHotspots(sampleReports);
      setResult(prev => prev + `\nHotspot Analysis: ✅ SUCCESS\nFound ${hotspotAnalysis.hotspots.length} hotspots`);
    }
  } catch (error: any) {
    setResult(`❌ Error: ${error.message}`);
  } finally {
    setTesting(false);
  }
};