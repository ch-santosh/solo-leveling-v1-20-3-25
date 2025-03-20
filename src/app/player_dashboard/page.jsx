"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Instagram, Twitter, Youtube, Linkedin, Edit,
  Medal, Activity, Calendar, MapPin, Phone,
  AlertCircle, Heart, Trophy, Dumbbell,
  Scale, Ruler, CircleUser, Mail, Target,
  ShoppingBag,
  CheckCircle,
  XCircle,
  Send,
  UserCheck,
  Building,
  Brain, Utensils, TrendingUp, ListTodo
} from "lucide-react";
import { doc, setDoc, collection, addDoc, serverTimestamp, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { toast } from "sonner";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

const PlayerDashboard = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coachDetails, setCoachDetails] = useState({});

  // Function to fetch fresh player data
  const fetchPlayerData = async (email) => {
    try {
      const playerRef = doc(db, "players", email);
      const playerSnap = await getDoc(playerRef);
      if (playerSnap.exists()) {
        const freshData = playerSnap.data();
        // Update both state and localStorage
        setPlayerData(freshData);
        localStorage.setItem('user', JSON.stringify(freshData));
        return freshData;
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
      toast.error("Failed to refresh player data");
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
          // Fetch fresh data from Firestore
          const freshData = await fetchPlayerData(userData.email);
          if (!freshData) {
            toast.error("User data not found");
          }
        } else {
          toast.error("User data not found");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Set up periodic refresh
  useEffect(() => {
    if (!playerData?.email) return;

    const refreshInterval = setInterval(() => {
      fetchPlayerData(playerData.email);
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(refreshInterval);
  }, [playerData?.email]);

  useEffect(() => {
    const fetchCoachDetails = async () => {
      if (!playerData?.marketplaceRequests) return;

      try {
        const details = {};
        for (const request of playerData.marketplaceRequests) {
          const coachRef = doc(db, "coaches", request.coachId);
          const coachSnap = await getDoc(coachRef);
          if (coachSnap.exists()) {
            details[request.coachId] = coachSnap.data();
          }
        }
        setCoachDetails(details);
      } catch (error) {
        console.error("Error fetching coach details:", error);
      }
    };

    fetchCoachDetails();
  }, [playerData?.marketplaceRequests]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>;
  }

  if (!playerData) {
    return <div className="min-h-screen flex items-center justify-center">
      No user data found
    </div>;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to handle marketplace request
  const handleMarketplaceRequest = async () => {
    try {
      setIsSubmitting(true);
      
      const requestData = {
        playerId: playerData.email,
        playerName: playerData.fullName,
        primarySport: playerData.primarySport,
        experience: playerData.playingExperience,
        currentLevel: playerData.currentLevel,
        achievements: playerData.achievements?.split(',') || [],
        lookingForCoach: playerData.lookingForCoach,
        lookingForTeam: playerData.lookingForTeam,
        location: playerData.address,
        email: playerData.email,
        height: playerData.height,
        weight: playerData.weight,
        dominantSide: playerData.dominantSide,
        currentClub: playerData.currentClub,
        status: "pending",
        createdAt: serverTimestamp(),
        marketplaceRequests: [],
        isVerified: false
      };

      // Create the marketplace_requests collection and add document
      const marketplaceRef = collection(db, "marketplace_requests");
      
      // Use addDoc instead of setDoc to let Firestore generate a unique ID
      await addDoc(marketplaceRef, requestData);

      toast.success("Marketplace request submitted successfully!");
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle connect request
  const handleConnectRequest = async (request) => {
    try {
      // Update the request status in player's document
      const playerRef = doc(db, "players", playerData.email);
      const updatedRequests = playerData.marketplaceRequests.map(req =>
        req.coachId === request.coachId ? { ...req, status: 'accepted' } : req
      );
      await updateDoc(playerRef, {
        marketplaceRequests: updatedRequests
      });

      // Update the request status in coach's document
      const coachRef = doc(db, "coaches", request.coachId);
      const coachSnap = await getDoc(coachRef);
      if (coachSnap.exists()) {
        const coachData = coachSnap.data();
        const updatedInterestedPlayers = coachData.interestedPlayers?.map(player =>
          player.playerId === playerData.email ? { ...player, status: 'accepted' } : player
        );
        await updateDoc(coachRef, {
          interestedPlayers: updatedInterestedPlayers
        });
      }

      // Fetch fresh data to update the UI
      await fetchPlayerData(playerData.email);
      toast.success("Connection accepted!");
    } catch (error) {
      console.error("Error accepting connection:", error);
      toast.error("Failed to accept connection");
    }
  };

  const AIInsights = ({ playerData, onUpdate }) => {
    const [insights, setInsights] = useState(playerData.generatedInsights || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateAIInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro-exp-02-05" });
        
        const prompt = `You are a sports analysis AI specializing in athlete development. Analyze this athlete's profile and provide constructive insights even with limited information.

        Athlete Profile:
        - Name: ${playerData.fullName}
        - Primary Sport: ${playerData.primarySport}
        - Experience Level: ${playerData.playingExperience} years
        - Current Level: ${playerData.currentLevel}
        - Physical Attributes: Height ${playerData.height}cm, Weight ${playerData.weight}kg
        - Career Goals: ${playerData.careerGoal || 'Not specified'}
        - Achievements: ${playerData.achievements || 'Not specified yet'}
        - Looking for Coach: ${playerData.lookingForCoach ? 'Yes' : 'No'}
        - Looking for Team: ${playerData.lookingForTeam ? 'Yes' : 'No'}
        ${playerData.fitnessLevel ? `- Fitness Level: ${playerData.fitnessLevel}` : ''}
        ${playerData.dominantSide ? `- Dominant Side: ${playerData.dominantSide}` : ''}

        Based on the available information, provide personalized insights. If certain details are missing, provide general best practices and recommendations for ${playerData.primarySport} athletes.

        Return exactly this structure (provide relevant insights based on the sport and available data):
        {
          "strengthAnalysis": "Focus on current strengths and potential based on physical attributes and experience level",
          "developmentAreas": "Identify key areas for improvement based on the sport's requirements and athlete's current level",
          "recommendations": [
            "Sport-specific training recommendation",
            "Level-appropriate competition suggestion",
            "Development pathway recommendation"
          ],
          "careerPathInsights": "Career guidance based on current level and goals",
          "trainingTips": [
            "Sport-specific training tip",
            "General athletic development tip",
            "Recovery and progression tip"
          ],
          "generatedAt": "${new Date().toISOString()}"
        }

        Ensure recommendations are specific to ${playerData.primarySport} and appropriate for a ${playerData.currentLevel} level athlete with ${playerData.playingExperience} years of experience.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Clean up the response text
        text = text.replace(/```json\n?|\n?```/g, ''); // Remove markdown code blocks
        text = text.trim(); // Remove whitespace
        
        // Add error handling for JSON parsing
        let parsedInsights;
        try {
          parsedInsights = JSON.parse(text);
          
          // Validate the required fields
          const requiredFields = [
            'strengthAnalysis', 
            'developmentAreas', 
            'recommendations', 
            'careerPathInsights', 
            'trainingTips',
            'generatedAt'
          ];
          
          const missingFields = requiredFields.filter(field => !parsedInsights[field]);
          
          if (missingFields.length > 0) {
            throw new Error(`Invalid response format. Missing fields: ${missingFields.join(', ')}`);
          }

          // Ensure arrays are actually arrays
          if (!Array.isArray(parsedInsights.recommendations) || !Array.isArray(parsedInsights.trainingTips)) {
            throw new Error('Recommendations and trainingTips must be arrays');
          }

          // Remove any "Example:" prefixes from the response
          parsedInsights.strengthAnalysis = parsedInsights.strengthAnalysis.replace(/^Example:\s*/i, '');
          parsedInsights.developmentAreas = parsedInsights.developmentAreas.replace(/^Example:\s*/i, '');
          parsedInsights.careerPathInsights = parsedInsights.careerPathInsights.replace(/^Example:\s*/i, '');
          parsedInsights.recommendations = parsedInsights.recommendations.map(rec => 
            rec.replace(/^Example:\s*/i, '')
          );
          parsedInsights.trainingTips = parsedInsights.trainingTips.map(tip => 
            tip.replace(/^Example:\s*/i, '')
          );

        } catch (parseError) {
          console.error("JSON Parse Error:", parseError);
          console.log("Raw AI Response:", text);
          throw new Error("Failed to parse AI response into valid JSON format");
        }

        // Update Firestore
        const playerRef = doc(db, "players", playerData.email);
        await updateDoc(playerRef, {
          generatedInsights: parsedInsights
        });

        // Update local state
        setInsights(parsedInsights);
        
        // Notify parent component to refresh player data
        onUpdate();
        
        toast.success("New insights generated!");
      } catch (error) {
        console.error("Error generating insights:", error);
        setError(error.message || "Failed to generate insights. Please try again.");
        toast.error("Failed to generate insights");
      } finally {
        setLoading(false);
      }
    };

    return (
      <Card className="p-6 mt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">AI Insights</h3>
          </div>
          <div className="flex items-center gap-2">
            {insights?.generatedAt && (
              <span className="text-sm text-muted-foreground">
                Last generated: {new Date(insights.generatedAt).toLocaleDateString()}
              </span>
            )}
            <Button 
              variant="outline" 
              onClick={generateAIInsights}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate New Insights"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-red-500 mb-4 p-4 bg-red-50 rounded-lg">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}

        {insights ? (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                Strength Analysis
              </h4>
              <p className="text-muted-foreground">{insights.strengthAnalysis}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Areas for Development
              </h4>
              <p className="text-muted-foreground">{insights.developmentAreas}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-primary" />
                Recommendations
              </h4>
              <ul className="list-disc list-inside space-y-1">
                {insights.recommendations.map((rec, index) => (
                  <li key={index} className="text-muted-foreground">{rec}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Career Path Insights
              </h4>
              <p className="text-muted-foreground">{insights.careerPathInsights}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-primary" />
                Training Tips
              </h4>
              <ul className="list-disc list-inside space-y-1">
                {insights.trainingTips.map((tip, index) => (
                  <li key={index} className="text-muted-foreground">{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No insights generated yet. Click the button above to get started!</p>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-4 gap-6 mb-6">
          {/* Profile Card */}
          <Card className="p-6 lg:col-span-1 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-primary/10">
                  <AvatarImage src={playerData.profilePicture} />
                  <AvatarFallback className="bg-primary/5">
                    <CircleUser className="w-16 h-16 text-primary/40" />
                  </AvatarFallback>
                </Avatar>
                <Badge className="absolute -bottom-2 right-0 px-3" variant={playerData.status === 'active' ? 'default' : 'secondary'}>
                  {playerData.status === 'active' ? '✓ Active' : '⌛ Pending'}
                </Badge>
              </div>
              
              <h2 className="text-2xl font-bold mt-4 mb-1">{playerData.fullName}</h2>
              <p className="text-muted-foreground mb-3 text-sm">
                {playerData.primarySport} Player • {playerData.currentLevel}
              </p>
              
              <div className="flex gap-2 mb-4">
                <Badge variant="outline" className="bg-primary/5">
                  {playerData.fitnessLevel}
                </Badge>
                <Badge variant="outline" className="bg-primary/5">
                  {`${playerData.playingExperience}Y Exp`}
                </Badge>
              </div>

              <div className="w-full space-y-2">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <div className="flex gap-2 justify-center mt-4">
                  <Button size="icon" variant="outline">
                    <Instagram className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Linkedin className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Overview */}
          <Card className="p-6 lg:col-span-3 bg-white shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Player Overview</h3>
              <Badge variant="outline" className="px-4">
                ID: #AP2024
              </Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{playerData.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{playerData.phone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{formatDate(playerData.dateOfBirth)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                  <Target className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Club</p>
                    <p className="font-medium">{playerData.currentClub}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                  <Scale className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Physical Stats</p>
                    <p className="font-medium">{playerData.height}cm • {playerData.weight}kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                  <Heart className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Blood Group</p>
                    <p className="font-medium">{playerData.bloodGroup}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{playerData.address}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Medical & Career Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <h3 className="text-xl font-semibold">Medical History</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <h4 className="font-medium mb-3">Medical Conditions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg ${playerData.medicalConditions.heartCondition ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    <p className="text-sm font-medium">Heart Condition</p>
                    <p className="text-lg">{playerData.medicalConditions.heartCondition ? 'Yes' : 'No'}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${playerData.existingInjuries ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    <p className="text-sm font-medium">Existing Injuries</p>
                    <p className="text-lg">{playerData.existingInjuries ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Career Goals</h3>
            </div>
            
            <div className="space-y-6">
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Career Objective</p>
                <p className="text-lg font-medium">{playerData.careerGoal}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${playerData.lookingForCoach ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  <Dumbbell className="w-5 h-5 mb-2" />
                  <p className="font-medium">Looking for Coach</p>
                  <p className="text-2xl font-semibold mt-1">{playerData.lookingForCoach ? "Yes" : "No"}</p>
                </div>
                <div className={`p-4 rounded-lg ${playerData.lookingForTeam ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  <Activity className="w-5 h-5 mb-2" />
                  <p className="font-medium">Looking for Team</p>
                  <p className="text-2xl font-semibold mt-1">{playerData.lookingForTeam ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Marketplace Section */}
        <div className="mt-6">
          <Card className="p-6 bg-white shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBag className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Marketplace</h3>
            </div>

            {playerData.status !== "active" ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-medium">Profile Not Verified</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get verified to connect with coaches and organizations in your area.
                    Submit a request to join the marketplace.
                  </p>
                  <Button 
                    onClick={handleMarketplaceRequest}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Marketplace Request
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-600 font-medium">Your profile is verified</p>
                </div>

                {playerData.marketplaceRequests?.length > 0 ? (
                  <div className="grid gap-4">
                    {playerData.marketplaceRequests.map((request, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 bg-primary/5 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={coachDetails[request.coachId]?.profilePicture} 
                              alt={request.coachName}
                            />
                            <AvatarFallback>
                              {request.coachName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{request.coachName}</p>
                              {coachDetails[request.coachId]?.isVerified && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <UserCheck className="w-4 h-4" />
                              <span>{coachDetails[request.coachId]?.primarySport} Coach</span>
                              <span>•</span>
                              <span>{new Date(request.date).toLocaleDateString()}</span>
                            </div>
                            {request.status === 'pending' && (
                              <Badge variant="outline" className="mt-2">
                                Pending
                              </Badge>
                            )}
                            {request.status === 'accepted' && (
                              <Badge variant="success" className="mt-2">
                                Connected
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const encodedEmail = encodeURIComponent(request.coachId);
                              window.location.href = `/profile/coach/${encodedEmail}`;
                            }}
                          >
                            View Profile
                          </Button>
                          {request.status === 'pending' && (
                            <Button 
                              size="sm"
                              onClick={() => handleConnectRequest(request)}
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <XCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No connection requests yet</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* AI Insights Section */}
        <AIInsights 
          playerData={playerData} 
          onUpdate={() => fetchPlayerData(playerData.email)} 
        />
      </div>
    </div>
  );
};

export default PlayerDashboard;