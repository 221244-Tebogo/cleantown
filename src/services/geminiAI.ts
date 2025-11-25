import { GoogleGenerativeAI } from "@google/generative-ai";
import * as FileSystem from "expo-file-system/legacy";
export interface AIAnalysis {
  category:
    | "household"
    | "construction"
    | "industrial"
    | "electronic"
    | "green_waste"
    | "hazardous"
    | "public_litter"
    | "other";
  severity: "low" | "medium" | "high";
  description: string;
  suggestedActions: string[];
  materials?: string[];
  estimatedVolume?: string; // small, medium, large
  cleanupPriority?: "immediate" | "scheduled" | "monitor";
  environmentalImpact?: "low" | "medium" | "high";
}

export interface CleanupSuggestion {
  equipment: string[];
  teamSize: string;
  timeEstimate: string;
  safetyTips: string[];
  specializedRequirements?: string[];
  disposalMethod?: string;
}

export interface HotspotArea {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  radius: number;
  severity: "low" | "medium" | "high";
  reportCount: number;
  trend: "increasing" | "decreasing" | "stable";
  commonMaterials: string[];
  dominantCategory?: string;
  peakTimes?: string[];
  lastReported: Date;
}

export interface PatternAnalysis {
  hotspots: HotspotArea[];
  temporalPatterns: TemporalPattern[];
  materialTrends: MaterialTrend[];
  categoryTrends: CategoryTrend[];
  recommendations: string[];
  overallTrend: "improving" | "worsening" | "stable";
  summary: string;
}

interface TemporalPattern {
  period: "morning" | "afternoon" | "evening" | "night" | "weekend" | "weekday";
  frequency: number;
  intensity: number;
}

interface MaterialTrend {
  material: string;
  frequency: number;
  trend: "increasing" | "decreasing" | "stable";
}

interface CategoryTrend {
  category: string;
  frequency: number;
  trend: "increasing" | "decreasing" | "stable";
}

class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Gemini API key not found");
      throw new Error("Gemini API key not found");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    console.log("Gemini AI service initialized with gemini-2.0-flash-001");
  }

  isAIAvailable(): boolean {
    return !!this.model;
  }

  async analyzeReport(
    imageUri?: string,
    description?: string
  ): Promise<AIAnalysis> {
    try {
      console.log("Starting AI analysis with enhanced classification...");

      const contents = [];

      // Add image if provided
      if (imageUri) {
        console.log("Processing image for detailed analysis...");
        try {
          const imageBase64 = await this.convertImageUriToBase64(imageUri);
          contents.push({
            inlineData: {
              data: imageBase64,
              mimeType: "image/jpeg",
            },
          });
        } catch (imageError) {
          console.error("Image conversion failed:", imageError);
        }
      }

      const prompt = this.buildDetailedAnalysisPrompt(description);
      contents.push({ text: prompt });

      console.log("Sending enhanced analysis request to Gemini...");
      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: contents }],
      });

      const response = await result.response;
      const text = response.text();

      console.log("Enhanced AI Response received");
      return this.parseEnhancedAnalysisResponse(text);
    } catch (error) {
      console.error("AI Analysis failed:", error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  private buildDetailedAnalysisPrompt(description?: string): string {
    return `As an environmental waste management expert, analyze this illegal dumping report and provide detailed classification:

${
  description
    ? `User Description: "${description}"`
    : "Analyze the provided image of illegal dumping."
}

Please classify this dumping incident by:

1. **Dumping Type** (choose one):
   - household: Furniture, appliances, general household waste
   - construction: Building materials, rubble, renovation waste  
   - industrial: Factory waste, manufacturing byproducts
   - electronic: E-waste, computers, appliances with circuits
   - green_waste: Garden waste, branches, grass clippings
   - hazardous: Chemicals, batteries, toxic materials
   - public_litter: Public space litter, scattered trash
   - other: Unclassifiable or mixed waste

2. **Severity Assessment**:
   - low: Small amount, easily manageable
   - medium: Significant amount, requires planning
   - high: Large scale, immediate attention needed

3. **Volume Estimate**: small/medium/large
4. **Cleanup Priority**: immediate/scheduled/monitor
5. **Environmental Impact**: low/medium/high
6. **Materials Present**: List all identifiable materials
7. **Specific Risks**: Any immediate dangers or concerns

Provide a concise summary and 3-5 specific recommended actions.

Format your response in a structured way that can be easily parsed.`;
  }

  private parseEnhancedAnalysisResponse(text: string): AIAnalysis {
    const lowerText = text.toLowerCase();

    let category: AIAnalysis["category"] = "other";
    if (
      lowerText.includes("household") ||
      lowerText.includes("furniture") ||
      lowerText.includes("appliance")
    ) {
      category = "household";
    } else if (
      lowerText.includes("construction") ||
      lowerText.includes("rubble") ||
      lowerText.includes("building") ||
      lowerText.includes("renovation")
    ) {
      category = "construction";
    } else if (
      lowerText.includes("industrial") ||
      lowerText.includes("factory") ||
      lowerText.includes("manufacturing")
    ) {
      category = "industrial";
    } else if (
      lowerText.includes("electronic") ||
      lowerText.includes("e-waste") ||
      lowerText.includes("computer") ||
      lowerText.includes("appliance")
    ) {
      category = "electronic";
    } else if (
      lowerText.includes("garden") ||
      lowerText.includes("green") ||
      lowerText.includes("branch") ||
      lowerText.includes("grass")
    ) {
      category = "green_waste";
    } else if (
      lowerText.includes("hazard") ||
      lowerText.includes("chemical") ||
      lowerText.includes("toxic") ||
      lowerText.includes("battery")
    ) {
      category = "hazardous";
    } else if (
      lowerText.includes("public") ||
      lowerText.includes("litter") ||
      lowerText.includes("scattered")
    ) {
      category = "public_litter";
    }

    // Enhanced severity detection
    let severity: "low" | "medium" | "high" = "low";
    if (
      lowerText.includes("high") ||
      lowerText.includes("urgent") ||
      lowerText.includes("emergency") ||
      lowerText.includes("immediate")
    ) {
      severity = "high";
    } else if (
      lowerText.includes("medium") ||
      lowerText.includes("significant") ||
      lowerText.includes("substantial")
    ) {
      severity = "medium";
    }

    let estimatedVolume: "small" | "medium" | "large" = "medium";
    if (
      lowerText.includes("small") ||
      lowerText.includes("minor") ||
      lowerText.includes("little")
    ) {
      estimatedVolume = "small";
    } else if (
      lowerText.includes("large") ||
      lowerText.includes("major") ||
      lowerText.includes("extensive")
    ) {
      estimatedVolume = "large";
    }

    let cleanupPriority: "immediate" | "scheduled" | "monitor" = "scheduled";
    if (
      lowerText.includes("immediate") ||
      lowerText.includes("urgent") ||
      lowerText.includes("emergency")
    ) {
      cleanupPriority = "immediate";
    } else if (
      lowerText.includes("monitor") ||
      lowerText.includes("observe") ||
      lowerText.includes("watch")
    ) {
      cleanupPriority = "monitor";
    }

    let environmentalImpact: "low" | "medium" | "high" = "medium";
    if (
      lowerText.includes("high impact") ||
      lowerText.includes("severe") ||
      lowerText.includes("serious environmental")
    ) {
      environmentalImpact = "high";
    } else if (
      lowerText.includes("low impact") ||
      lowerText.includes("minimal") ||
      lowerText.includes("minor environmental")
    ) {
      environmentalImpact = "low";
    }

    return {
      category,
      severity,
      estimatedVolume,
      cleanupPriority,
      environmentalImpact,
      description: this.cleanAIResponse(text),
      suggestedActions: this.extractSuggestedActions(text),
      materials: this.extractEnhancedMaterials(text),
    };
  }

  private cleanAIResponse(text: string): string {
    return (
      text
        .replace(/```[\s\S]*?```/g, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .slice(0, 4) // Take first 4 meaningful lines
        .join("\n")
        .substring(0, 250) + (text.length > 250 ? "..." : "")
    );
  }

  private extractSuggestedActions(text: string): string[] {
    const actions: string[] = [];
    const lines = text.split("\n");

    lines.forEach((line) => {
      const cleanLine = line.replace(/^[\d\-•*]\s*/, "").trim();
      if (
        (cleanLine.includes("recommend") ||
          cleanLine.includes("suggest") ||
          cleanLine.includes("action") ||
          cleanLine.includes("should") ||
          (cleanLine.includes("wear") && cleanLine.includes("equipment"))) &&
        cleanLine.length > 20 &&
        cleanLine.length < 100
      ) {
        actions.push(cleanLine);
      }
    });

    if (actions.length === 0) {
      return [
        "Assess area safety before approaching",
        "Document with photos from multiple angles",
        "Report to local authorities if hazardous",
        "Coordinate with community cleanup team",
      ];
    }

    return actions.slice(0, 4);
  }

  private extractEnhancedMaterials(text: string): string[] {
    const materials = [];
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes("plastic") ||
      lowerText.includes("bottle") ||
      lowerText.includes("bag")
    )
      materials.push("plastic");
    if (
      lowerText.includes("glass") ||
      lowerText.includes("bottle") ||
      lowerText.includes("jar")
    )
      materials.push("glass");
    if (
      lowerText.includes("paper") ||
      lowerText.includes("cardboard") ||
      lowerText.includes("packaging")
    )
      materials.push("paper");
    if (
      lowerText.includes("metal") ||
      lowerText.includes("can") ||
      lowerText.includes("scrap")
    )
      materials.push("metal");
    if (
      lowerText.includes("organic") ||
      lowerText.includes("food") ||
      lowerText.includes("wood") ||
      lowerText.includes("plant")
    )
      materials.push("organic");
    if (
      lowerText.includes("hazard") ||
      lowerText.includes("chemical") ||
      lowerText.includes("battery") ||
      lowerText.includes("asbestos")
    )
      materials.push("hazardous");
    if (
      lowerText.includes("construction") ||
      lowerText.includes("concrete") ||
      lowerText.includes("brick") ||
      lowerText.includes("drywall")
    )
      materials.push("construction");
    if (
      lowerText.includes("electronic") ||
      lowerText.includes("e-waste") ||
      lowerText.includes("circuit") ||
      lowerText.includes("cable")
    )
      materials.push("electronic");
    if (
      lowerText.includes("textile") ||
      lowerText.includes("fabric") ||
      lowerText.includes("cloth") ||
      lowerText.includes("clothing")
    )
      materials.push("textile");
    if (lowerText.includes("rubber") || lowerText.includes("tire"))
      materials.push("rubber");
    if (
      lowerText.includes("medical") ||
      lowerText.includes("syringe") ||
      lowerText.includes("needle")
    )
      materials.push("medical");

    return materials.length > 0 ? materials : ["mixed waste"];
  }

  async generateCleanupPlan(analysis: AIAnalysis): Promise<CleanupSuggestion> {
    try {
      const prompt = this.buildCleanupPlanPrompt(analysis);

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const response = await result.response;
      const text = response.text();

      return this.parseCleanupPlanResponse(text, analysis);
    } catch (error) {
      console.error("Cleanup plan generation failed:", error);
      return this.getDefaultCleanupPlan(analysis);
    }
  }

  private buildCleanupPlanPrompt(analysis: AIAnalysis): string {
    return `Create a detailed cleanup plan for this illegal dumping incident:

Dumping Type: ${analysis.category}
Severity: ${analysis.severity}
Volume: ${analysis.estimatedVolume}
Materials: ${analysis.materials?.join(", ") || "unknown"}

Please provide:
1. Required equipment (specific to this dumping type)
2. Recommended team size
3. Realistic time estimate
4. Safety precautions specific to the materials
5. Specialized requirements or disposal methods
6. Any regulatory considerations

Focus on practical, actionable steps for community cleanup crews.`;
  }

  private parseCleanupPlanResponse(
    text: string,
    analysis: AIAnalysis
  ): CleanupSuggestion {
    const lowerText = text.toLowerCase();

    const defaultPlan = this.getDefaultCleanupPlan(analysis);

    const equipment = [...defaultPlan.equipment];
    if (
      lowerText.includes("gloves") &&
      !equipment.includes("heavy-duty gloves")
    )
      equipment.push("heavy-duty gloves");
    if (lowerText.includes("goggles") && !equipment.includes("safety goggles"))
      equipment.push("safety goggles");
    if (lowerText.includes("mask") && !equipment.includes("respirator masks"))
      equipment.push("respirator masks");
    if (lowerText.includes("shovel") && !equipment.includes("shovels"))
      equipment.push("shovels");
    if (lowerText.includes("rake") && !equipment.includes("rakes"))
      equipment.push("rakes");

    let teamSize = defaultPlan.teamSize;
    if (
      lowerText.includes("large team") ||
      lowerText.includes("multiple crews")
    )
      teamSize = "8-12 people";
    if (lowerText.includes("small team") || lowerText.includes("2-3"))
      teamSize = "2-3 people";

    // Extract time estimates
    let timeEstimate = defaultPlan.timeEstimate;
    if (lowerText.includes("hours") && text.match(/\d+\s*hours/)) {
      const match = text.match(/(\d+)\s*hours/);
      timeEstimate = `${match ? match[1] : "2-4"} hours`;
    }

    return {
      ...defaultPlan,
      equipment,
      teamSize,
      timeEstimate,
      safetyTips:
        this.extractSafetyTips(text, analysis) || defaultPlan.safetyTips,
    };
  }

  private extractSafetyTips(text: string, analysis: AIAnalysis): string[] {
    const tips: string[] = [];
    const lines = text.split("\n");

    lines.forEach((line) => {
      const cleanLine = line.replace(/^[\d\-•*]\s*/, "").trim();
      if (
        (cleanLine.includes("safety") ||
          cleanLine.includes("caution") ||
          cleanLine.includes("wear") ||
          cleanLine.includes("avoid") ||
          cleanLine.includes("protective")) &&
        cleanLine.length > 15 &&
        cleanLine.length < 80
      ) {
        tips.push(cleanLine);
      }
    });

    return tips.length > 0
      ? tips.slice(0, 4)
      : this.getDefaultSafetyTips(analysis);
  }

  private getDefaultCleanupPlan(analysis: AIAnalysis): CleanupSuggestion {
    const basePlan = {
      equipment: ["heavy-duty gloves", "safety vests", "trash bags"],
      teamSize: "4-6 people",
      timeEstimate: "2-3 hours",
      safetyTips: this.getDefaultSafetyTips(analysis),
      disposalMethod: "standard municipal collection",
    };

    switch (analysis.category) {
      case "hazardous":
        return {
          ...basePlan,
          equipment: [
            ...basePlan.equipment,
            "hazardous material suits",
            "respirators",
            "containment bags",
          ],
          teamSize: "trained specialists only",
          safetyTips: [
            ...basePlan.safetyTips,
            "Do not touch unknown chemicals",
            "Evacuate area if strong odors",
          ],
          disposalMethod: "licensed hazardous waste disposal",
        };

      case "construction":
        return {
          ...basePlan,
          equipment: [
            ...basePlan.equipment,
            "wheelbarrows",
            "heavy-duty shovels",
            "debris nets",
          ],
          teamSize: "6-8 people",
          timeEstimate: "4-6 hours",
          disposalMethod: "construction waste recycling center",
        };

      case "electronic":
        return {
          ...basePlan,
          equipment: [
            ...basePlan.equipment,
            "protective eyewear",
            "cardboard boxes for components",
          ],
          safetyTips: [
            ...basePlan.safetyTips,
            "Handle screens carefully to avoid breakage",
            "Check for battery leaks",
          ],
          disposalMethod: "e-waste recycling facility",
        };

      case "green_waste":
        return {
          ...basePlan,
          equipment: [
            ...basePlan.equipment,
            "pruners",
            "rakes",
            "yard waste bags",
          ],
          disposalMethod: "composting facility or green waste recycling",
        };

      default:
        return basePlan;
    }
  }

  private getDefaultSafetyTips(analysis: AIAnalysis): string[] {
    const baseTips = [
      "Wear protective gloves at all times",
      "Use proper lifting techniques for heavy items",
      "Stay hydrated and take regular breaks",
    ];

    if (analysis.category === "hazardous") {
      return [
        "Do not approach without proper training",
        "Evacuate area and contact hazardous materials team",
        "Avoid inhaling fumes or dust",
      ];
    }

    if (analysis.severity === "high") {
      baseTips.unshift("Assess structural stability before approaching");
    }

    return baseTips;
  }
  async analyzeHotspots(reports: any[]): Promise<PatternAnalysis> {
    try {
      console.log(`Analyzing patterns across ${reports.length} reports...`);

      if (reports.length === 0) {
        return this.getEmptyAnalysis();
      }

      // First do algorithmic analysis
      const algorithmicAnalysis = this.analyzePatternsAlgorithmically(reports);

      const aiEnhancedAnalysis = await this.enhanceWithAIInsights(
        algorithmicAnalysis,
        reports
      );

      return aiEnhancedAnalysis;
    } catch (error) {
      console.error("Hotspot analysis failed:", error);
      // Fall back to algorithmic analysis only
      return this.analyzePatternsAlgorithmically(reports);
    }
  }

  private async enhanceWithAIInsights(
    algorithmicAnalysis: PatternAnalysis,
    reports: any[]
  ): Promise<PatternAnalysis> {
    try {
      const prompt = this.buildHotspotAnalysisPrompt(
        algorithmicAnalysis,
        reports
      );

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const response = await result.response;
      const text = response.text();

      return this.mergeAIInsights(algorithmicAnalysis, text);
    } catch (error) {
      console.error(
        "AI enhancement failed, using algorithmic analysis:",
        error
      );
      return algorithmicAnalysis;
    }
  }

  private buildHotspotAnalysisPrompt(
    analysis: PatternAnalysis,
    reports: any[]
  ): string {
    return `As an environmental pattern analysis expert, analyze these litter report patterns and provide strategic insights:

PATTERN SUMMARY:
- ${analysis.hotspots.length} hotspots identified
- ${analysis.materialTrends.length} material types tracked
- Overall trend: ${analysis.overallTrend}
- Top materials: ${analysis.materialTrends
      .slice(0, 3)
      .map((m) => m.material)
      .join(", ")}

KEY HOTSPOTS:
${analysis.hotspots
  .slice(0, 5)
  .map(
    (h) =>
      `- ${h.name}: ${h.reportCount} reports, ${
        h.severity
      } severity, materials: ${h.commonMaterials.join(", ")}`
  )
  .join("\n")}

TEMPORAL PATTERNS:
${analysis.temporalPatterns
  .slice(0, 3)
  .map(
    (t) =>
      `- ${t.period}: ${t.frequency} reports, intensity: ${t.intensity.toFixed(
        1
      )}`
  )
  .join("\n")}

Please provide:
1. A concise 3-5 sentence summary of the overall situation
2. 4-6 strategic recommendations for cleanup operations
3. Any unusual patterns or insights a human might miss
4. Priority areas for immediate action

Format as a structured analysis that can be programmatically parsed.`;
  }

  private mergeAIInsights(
    algorithmicAnalysis: PatternAnalysis,
    aiResponse: string
  ): PatternAnalysis {
    // Extract summary from AI response (first paragraph)
    const summary = aiResponse.split("\n")[0] + " " + aiResponse.split("\n")[1];

    // Enhanced recommendations combining algorithmic and AI insights
    const enhancedRecommendations = [
      ...algorithmicAnalysis.recommendations,
      ...this.extractAIRecommendations(aiResponse),
    ];

    return {
      ...algorithmicAnalysis,
      summary: summary.substring(0, 200) + (summary.length > 200 ? "..." : ""),
      recommendations: enhancedRecommendations.slice(0, 6), // Limit to top 6
    };
  }

  private extractAIRecommendations(aiResponse: string): string[] {
    const recommendations: string[] = [];
    const lines = aiResponse.split("\n");

    lines.forEach((line) => {
      if (
        (line.includes("recommend") ||
          line.includes("suggest") ||
          line.includes("priority")) &&
        line.length > 20 &&
        line.length < 100
      ) {
        const cleanRec = line.replace(/^[-\d\.\s]*/, "").trim();
        if (
          cleanRec &&
          !cleanRec.includes("Format") &&
          !cleanRec.includes("Please provide")
        ) {
          recommendations.push(cleanRec);
        }
      }
    });

    return recommendations.slice(0, 3);
  }

  private analyzePatternsAlgorithmically(reports: any[]): PatternAnalysis {
    const hotspots = this.calculateHotspots(reports);
    const temporalPatterns = this.analyzeTemporalPatterns(reports);
    const materialTrends = this.analyzeMaterialTrends(reports);

    return {
      hotspots,
      temporalPatterns,
      materialTrends,
      recommendations: this.generateRecommendations(
        hotspots,
        temporalPatterns,
        materialTrends
      ),
      overallTrend: this.calculateOverallTrend(reports),
      summary: this.generateSummary(hotspots, materialTrends, temporalPatterns),
    };
  }

  private calculateHotspots(reports: any[]): HotspotArea[] {
    const clusters: HotspotArea[] = [];

    const sortedReports = [...reports].sort(
      (a, b) =>
        this.calculateLocationDensity(a, reports) -
        this.calculateLocationDensity(b, reports)
    );

    sortedReports.forEach((report) => {
      const nearbyCluster = clusters.find(
        (cluster) =>
          this.calculateDistance(cluster.coordinates, report.location) < 500 // 500 meter radius
      );

      if (nearbyCluster) {
        nearbyCluster.reportCount++;
        nearbyCluster.severity = this.calculateClusterSeverity([
          nearbyCluster.severity,
          report.severity,
        ]);
        nearbyCluster.commonMaterials = [
          ...new Set([
            ...nearbyCluster.commonMaterials,
            ...(report.materials || []),
          ]),
        ];
        if (new Date(report.timestamp) > nearbyCluster.lastReported) {
          nearbyCluster.lastReported = new Date(report.timestamp);
        }
      } else {
        clusters.push({
          id: `hotspot-${clusters.length + 1}`,
          name: `Area ${clusters.length + 1}`,
          coordinates: report.location,
          radius: 500,
          severity: report.severity,
          reportCount: 1,
          trend: "stable",
          commonMaterials: report.materials || ["mixed waste"],
          lastReported: new Date(report.timestamp),
        });
      }
    });

    return clusters
      .filter((cluster) => cluster.reportCount > 1) // Only show clusters with multiple reports
      .sort((a, b) => b.reportCount - a.reportCount);
  }

  private analyzeTemporalPatterns(reports: any[]): TemporalPattern[] {
    const patterns: {
      [key: string]: { count: number; totalSeverity: number };
    } = {};

    reports.forEach((report) => {
      const date = new Date(report.timestamp);
      const hour = date.getHours();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      let period = "";
      if (hour >= 6 && hour < 12) period = "morning";
      else if (hour >= 12 && hour < 17) period = "afternoon";
      else if (hour >= 17 && hour < 22) period = "evening";
      else period = "night";

      const key = isWeekend ? `weekend-${period}` : `weekday-${period}`;

      if (!patterns[key]) {
        patterns[key] = { count: 0, totalSeverity: 0 };
      }

      patterns[key].count++;
      patterns[key].totalSeverity += this.severityToNumber(report.severity);
    });

    return Object.entries(patterns)
      .map(([period, data]) => ({
        period: period as TemporalPattern["period"],
        frequency: data.count,
        intensity: data.totalSeverity / data.count,
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  private analyzeMaterialTrends(reports: any[]): MaterialTrend[] {
    const materialCounts: { [key: string]: number } = {};

    reports.forEach((report) => {
      (report.materials || ["mixed waste"]).forEach((material) => {
        materialCounts[material] = (materialCounts[material] || 0) + 1;
      });
    });

    return Object.entries(materialCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([material, frequency]) => ({
        material,
        frequency,
        trend: "stable",
      }));
  }

  private generateRecommendations(
    hotspots: HotspotArea[],
    temporalPatterns: TemporalPattern[],
    materialTrends: MaterialTrend[]
  ): string[] {
    const recommendations: string[] = [];

    const highSeverityHotspots = hotspots.filter((h) => h.severity === "high");
    if (highSeverityHotspots.length > 0) {
      recommendations.push(
        `Priority cleanup needed in ${highSeverityHotspots.length} high-severity areas`
      );
    }

    const peakPeriod = temporalPatterns[0];
    if (peakPeriod) {
      recommendations.push(
        `Focus patrols during ${peakPeriod.period} (peak reporting time)`
      );
    }

    const topMaterial = materialTrends[0];
    if (topMaterial) {
      recommendations.push(
        `Allocate resources for ${topMaterial.material} waste management`
      );
    }

    if (hotspots.length > 0) {
      recommendations.push(
        `Monitor ${hotspots.length} identified problem areas regularly`
      );
    }

    return recommendations;
  }

  private generateSummary(
    hotspots: HotspotArea[],
    materialTrends: MaterialTrend[],
    temporalPatterns: TemporalPattern[]
  ): string {
    const totalReports = hotspots.reduce((sum, h) => sum + h.reportCount, 0);
    const topMaterial = materialTrends[0]?.material || "various";
    const peakTime = temporalPatterns[0]?.period || "different times";

    return `Found ${hotspots.length} problem areas with ${totalReports} total reports. Most common material is ${topMaterial}, with peak activity during ${peakTime}.`;
  }

  private async convertImageUriToBase64(imageUri: string): Promise<string> {
    try {
      console.log("Converting image URI to base64:", imageUri);

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: "base64", // Use string literal instead of FileSystem.EncodingType.Base64
      });

      if (!base64 || base64.length < 100) {
        throw new Error(
          "Invalid image data - file may be corrupted or too small"
        );
      }

      console.log("Base64 conversion successful, data length:", base64.length);
      return base64;
    } catch (error) {
      console.error("Base64 conversion error:", error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  private parseAnalysisResponse(
    text: string,
    description?: string
  ): AIAnalysis {
    const lowerText = text.toLowerCase();
    let category: "dumping" | "hazard" | "other" = "other";
    if (
      lowerText.includes("hazard") ||
      lowerText.includes("danger") ||
      lowerText.includes("chemical")
    ) {
      category = "hazard";
    } else if (
      lowerText.includes("dump") ||
      lowerText.includes("trash") ||
      lowerText.includes("litter")
    ) {
      category = "dumping";
    }

    let severity: "low" | "medium" | "high" = "low";
    if (
      lowerText.includes("high") ||
      lowerText.includes("urgent") ||
      lowerText.includes("emergency")
    ) {
      severity = "high";
    } else if (
      lowerText.includes("medium") ||
      lowerText.includes("significant")
    ) {
      severity = "medium";
    }

    return {
      category,
      severity,
      description: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
      suggestedActions: [
        "Assess area safety before proceeding",
        "Wear appropriate protective equipment",
        "Document the issue thoroughly",
      ],
      materials: this.extractMaterials(text),
    };
  }

  private extractMaterials(text: string): string[] {
    const materials = [];
    const lowerText = text.toLowerCase();
    if (lowerText.includes("plastic")) materials.push("plastic");
    if (lowerText.includes("glass")) materials.push("glass");
    if (lowerText.includes("paper")) materials.push("paper");
    if (lowerText.includes("metal")) materials.push("metal");
    if (lowerText.includes("organic") || lowerText.includes("food"))
      materials.push("organic");
    if (lowerText.includes("hazard") || lowerText.includes("chemical"))
      materials.push("hazardous");
    if (lowerText.includes("construction") || lowerText.includes("concrete"))
      materials.push("construction");
    return materials.length > 0 ? materials : ["mixed waste"];
  }

  private calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ): number {
    const R = 6371e3;
    const φ1 = (coord1.lat * Math.PI) / 180;
    const φ2 = (coord2.lat * Math.PI) / 180;
    const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateLocationDensity(report: any, allReports: any[]): number {
    return allReports.filter(
      (r) => this.calculateDistance(report.location, r.location) < 500
    ).length;
  }

  private severityToNumber(severity: string): number {
    switch (severity) {
      case "low":
        return 1;
      case "medium":
        return 2;
      case "high":
        return 3;
      default:
        return 1;
    }
  }

  private calculateClusterSeverity(
    severities: string[]
  ): "low" | "medium" | "high" {
    const avgSeverity =
      severities.reduce(
        (sum, severity) => sum + this.severityToNumber(severity),
        0
      ) / severities.length;
    if (avgSeverity >= 2.5) return "high";
    if (avgSeverity >= 1.5) return "medium";
    return "low";
  }

  private calculateOverallTrend(
    reports: any[]
  ): "improving" | "worsening" | "stable" {
    if (reports.length < 4) return "stable";
    const sortedReports = reports.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const firstHalf = sortedReports.slice(
      0,
      Math.floor(sortedReports.length / 2)
    );
    const secondHalf = sortedReports.slice(
      Math.floor(sortedReports.length / 2)
    );
    const firstAvg =
      firstHalf.reduce((sum, r) => sum + this.severityToNumber(r.severity), 0) /
      firstHalf.length;
    const secondAvg =
      secondHalf.reduce(
        (sum, r) => sum + this.severityToNumber(r.severity),
        0
      ) / secondHalf.length;
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    if (change > 15) return "worsening";
    if (change < -15) return "improving";
    return "stable";
  }

  private getEmptyAnalysis(): PatternAnalysis {
    return {
      hotspots: [],
      temporalPatterns: [],
      materialTrends: [],
      recommendations: ["Collect more reports to identify patterns"],
      overallTrend: "stable",
      summary: "No reports available for analysis",
    };
  }

  async generateChatResponse(
    userMessage: string,
    context?: { level: number; xp: number }
  ): Promise<string> {
    try {
      console.log("Generating fun chat response for:", userMessage);

      const prompt = `You are "Eco-Bot", a fun, enthusiastic AI assistant for a cleanup app called CleanTown. The user is at level ${
        context?.level || 1
      } with ${context?.xp || 0} XP.

User Message: "${userMessage}"

Respond as a gamified cleanup companion:
- Be SUPER fun, playful, and motivational! 🎮🌱
- Include 2-3 relevant emojis naturally
- Give practical, actionable cleanup tips
- Reference gamification (levels, XP, badges) when relevant
- Keep responses engaging but concise (150-300 words)
- Sound like an excited game guide/friend
- Focus on environmental impact and community action
- Make it personal and engaging

SPECIFIC RESPONSE GUIDES:
• For "fun recycling fact": Share surprising, mind-blowing facts!
• For "level up faster": Give specific XP-earning strategies
• For "eco-hero name": Create creative, personalized superhero names
• For "cleanup story": Tell short, inspiring fictional stories
• For "daily challenge": Create specific, achievable missions

Return ONLY the fun response text, no markdown, no prefixes like "Eco-Bot:".`;

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const response = await result.response;
      const text = response.text();

      console.log("Fun chat response generated successfully");
      return this.cleanChatResponse(text);
    } catch (error) {
      console.error("Chat response failed:", error);
      return "I'm having trouble responding right now! But don't worry - you can still go out and be an eco-hero! Pick up 5 pieces of litter and you'll already be making a difference! 🌟🎮";
    }
  }

  private cleanChatResponse(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^["']|["']$/g, "")
      .replace(/^(Eco-Bot|AI|Assistant):?\s*/i, "")
      .trim();
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.model.generateContent("Say 'OK' if working");
      return !!result;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }
}

export const geminiAI = new GeminiAIService();
