import React, { useState, useEffect } from "react";
import { View, Text, Image, ActivityIndicator, ScrollView, StyleSheet, Pressable, Dimensions } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { theme } from "../constants/theme";

const API_KEY = "eShBfjm9LLMnYnwISmnvJ7zrArKyJwi4jugaQhtwtL"; // Your API Key
const HEALTH_ASSESSMENT_URL = "https://plant.id/api/v3/health_assessment?details=local_name,description,url,treatment,classification,common_names,cause";

const { height } = Dimensions.get("window");

const DiseaseDetection = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [contentPosition, setContentPosition] = useState("center");
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    if (result) {
      setContentPosition("flex-start");
      setShowInstructions(false);
    } else {
      setContentPosition("center");
      setShowInstructions(true);
    }
  }, [result]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      identifyCrop(result.assets[0].base64);
    }
  };

  
  const takePicture = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      identifyCrop(result.assets[0].base64);
    }
  };

  const identifyCrop = async (base64Image) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        images: [base64Image],
        latitude: 0,
        longitude: 0,
        similar_images: true,
        health: "only",
      };

      const response = await fetch(HEALTH_ASSESSMENT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data. Please check your API key and URL.");
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error identifying crop:", error);
      setError(error.message);
    }
    setLoading(false);
  };

  const renderResults = () => (
    <ScrollView style={styles.resultContainer}>
      <Text style={styles.resultTitle}>Detection Results:</Text>

      <View style={styles.card}>
        <Text>🌱 Is Plant: {result.result?.is_plant?.binary ? "Yes ✅" : "No ❌"}</Text>
        <Text>💚 Health Status: {result.result?.is_healthy?.binary ? "Healthy 🌿" : "Unhealthy 🍂"}</Text>
        <Text>📊 Health Probability: {(result.result?.is_healthy?.probability * 100).toFixed(2)}%</Text>
      </View>

      {result.result?.disease?.suggestions?.length > 0 ? (
        result.result.disease.suggestions.map((disease, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.diseaseTitle}>{disease.name}</Text>
            <Text>Description: {disease.details?.description}</Text>
            <Text>Local Name: {disease.details?.local_name || "N/A"}</Text>
            <Text>Classification: {disease.details?.classification || "N/A"}</Text>
            <Text>Probability: {(disease.probability * 100).toFixed(2)}%</Text>

            {disease.details?.treatment && (
              <View>
                <Text style={styles.subHeading}>🛠️ Treatment:</Text>
                {disease.details.treatment.biological?.map((step, i) => (
                  <Text key={i} style={styles.listItem}>🔹 {step}</Text>
                ))}
                <Text style={styles.subHeading}>🛡️ Prevention:</Text>
                {disease.details.treatment.prevention?.map((item, i) => (
                  <Text key={i} style={styles.listItem}>🔸 {item}</Text>
                ))}
              </View>
            )}
          </View>
        ))
      ) : (
        <Text>No disease detected.</Text>
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { justifyContent: contentPosition }]}>
      <Image source={require("../assets/images/disease.jpg")} style={styles.backgroundImage} />
      <LinearGradient colors={["rgba(0,0,0,0.6)", "transparent"]} style={styles.gradientOverlay} />
      {result && <BlurView intensity={80} style={styles.blurView} />}
      
      <Text style={styles.title}> Plant Health Assessment </Text>

      <View style={styles.buttonContainer}>
        <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={pickImage}>
          <Text style={styles.buttonText}>📷 Pick an Image</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={takePicture}>
          <Text style={styles.buttonText}>📸 Take a Picture</Text>
        </Pressable>
      </View>

      {showInstructions && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionText}>Instructions :-</Text>
          <Text style={styles.instructionText}>1. Take close picture of the infected part</Text>
          <Text style={styles.instructionText}>2. If you are uploading image make sure infected part is detectable</Text>
          <Text style={styles.instructionText}>3. Image should be clear</Text>
        </View>
      )}

      {image && <Image source={{ uri: image }} style={styles.image} />}
      {loading && <ActivityIndicator size="large" color="#4CAF50" />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {result && renderResults()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: "#fff" },
  backgroundImage: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  gradientOverlay: { ...StyleSheet.absoluteFillObject },
  blurView: { ...StyleSheet.absoluteFillObject },
  buttonContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "40%",
    elevation: 5,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: "#fff", fontWeight: "bold" },
  image: { width: 250, height: 250, borderRadius: 10, marginBottom: 15, alignSelf: "center" },
  resultContainer: { marginTop: 20, backgroundColor: "#fff", padding: 15, borderRadius: 10 },
  resultTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  card: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f1f8e9",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  instructionsContainer: {
    padding: 15,
    backgroundColor: theme.colors.gray, // Semi-transparent white background
    borderRadius: 10,
    marginHorizontal: 20, // Add horizontal margin for spacing
    marginBottom: 20, // Add bottom margin for spacing
    alignSelf: 'center', // Center the container horizontally
    width: '90%', // Set a width for the container
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 5,
    color: theme.colors.text,
    fontWeight : theme.fonts.extraBold,
     // Darker text color for better readability
  },
  diseaseTitle: { 
    fontSize: 18, 
    fontWeight: "bold",
     color: "#2e7d32"
   },
  subHeading: { fontWeight: "bold", marginTop: 10 },
  listItem: { marginLeft: 10, marginBottom: 5 },
  errorText: { color: "red", marginTop: 10, textAlign: "center" },
})

export default DiseaseDetection;
