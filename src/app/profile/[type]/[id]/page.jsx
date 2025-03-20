"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Medal, Activity, Calendar, MapPin, Phone,
  Mail, Trophy, Dumbbell, Heart, Star,
  GraduationCap, Award, Clock, Briefcase,
  CheckCircle, Target, UserCheck, Users,
  AlertCircle, Building, Brain, Utensils, TrendingUp, ListTodo
} from "lucide-react";
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/app/utils/firebase';
import { useParams } from 'next/navigation';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_PROFILE_IMAGE = "https://api.dicebear.com/7.x/initials/svg";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const type = params?.type;
  const id = params?.id;

  useEffect(() => {
    if (type && id) {
      fetchProfileData();
    }
  }, [type, id]);

  const fetchProfileData = async () => {
    try {
      // Decode the email from URL
      const decodedEmail = decodeURIComponent(id);
      
      // Get document using email as ID
      const docRef = doc(db, `${type==="coach" ? "coaches" : "players"}`, decodedEmail);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
      } else {
        toast.error("Profile not found");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!profileData) {
    return <div className="min-h-screen flex items-center justify-center">Profile not found</div>;
  }

  const renderPlayerDetails = () => (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Athletic Details */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Athletic Details</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-4 h-4 text-primary" />
            <span>Level: {profileData.currentLevel}</span>
          </div>
          <div className="flex items-center gap-3">
            <Dumbbell className="w-4 h-4 text-primary" />
            <span>Physical: {profileData.height}cm, {profileData.weight}kg</span>
          </div>
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-primary" />
            <span>Dominant Side: {profileData.dominantSide}</span>
          </div>
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-primary" />
            <span>Blood Group: {profileData.bloodGroup}</span>
          </div>
        </div>
      </Card>

      {/* Sports Details */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Sports Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-4 h-4 text-primary" />
            <span>Primary Sport: {profileData.primarySport}</span>
          </div>
          {profileData.secondarySport && (
            <div className="flex items-center gap-3">
              <Trophy className="w-4 h-4 text-primary" />
              <span>Secondary Sport: {profileData.secondarySport}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-primary" />
            <span>Experience: {profileData.playingExperience} years</span>
          </div>
          {profileData.currentClub && (
            <div className="flex items-center gap-3">
              <Building className="w-4 h-4 text-primary" />
              <span>Current Club: {profileData.currentClub}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Medical Information */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Medical Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-primary" />
            <span>Fitness Level: {profileData.fitnessLevel}</span>
          </div>
          {profileData.existingInjuries && (
            <div className="flex items-center gap-3 text-yellow-600">
              <AlertCircle className="w-4 h-4" />
              <span>Has Existing Injuries</span>
            </div>
          )}
          {profileData.medicalConditions && (
            <div className="space-y-2">
              <p className="font-medium">Medical Conditions:</p>
              <ul className="list-disc list-inside pl-4 text-sm">
                {Object.entries(profileData.medicalConditions)
                  .filter(([_, value]) => value)
                  .map(([condition]) => (
                    <li key={condition} className="capitalize">{condition}</li>
                  ))
                }
              </ul>
            </div>
          )}
          {profileData.allergies && (
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-primary" />
              <span>Allergies: {profileData.allergies}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Career & Goals */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Career & Goals</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Target className="w-4 h-4 text-primary" />
            <span>Career Goal: {profileData.careerGoal}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              <span>Looking for Coach: {profileData.lookingForCoach ? "Yes" : "No"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Looking for Team: {profileData.lookingForTeam ? "Yes" : "No"}</span>
            </div>
          </div>
          {profileData.achievements && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Medal className="w-4 h-4 text-primary" />
                <span className="font-medium">Achievements:</span>
              </div>
              <ul className="list-disc list-inside pl-4 text-sm">
                {profileData.achievements.split(',').map((achievement, index) => (
                  <li key={index}>{achievement.trim()}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderCoachDetails = () => (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Coaching Details */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Coaching Details</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Star className="w-4 h-4 text-primary" />
            <span>Level: {profileData.coachingLevel}</span>
          </div>
          <div className="flex items-center gap-3">
            <Award className="w-4 h-4 text-primary" />
            <span>Experience: {profileData.yearsExperience}</span>
          </div>
          <div className="flex items-center gap-3">
            <Trophy className="w-4 h-4 text-primary" />
            <span>Primary Sport: {profileData.primarySport}</span>
          </div>
          {profileData.coachingPhilosophy && (
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-primary" />
              <span>Philosophy: {profileData.coachingPhilosophy}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Qualifications */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Qualifications</h3>
        <div className="space-y-4">
          {profileData.certifications && (
            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span>Certifications: {profileData.certifications}</span>
            </div>
          )}
          {profileData.achievements && (
            <div className="flex items-center gap-3">
              <Medal className="w-4 h-4 text-primary" />
              <span>Achievements: {profileData.achievements}</span>
            </div>
          )}
          {profileData.currentAffiliation && (
            <div className="flex items-center gap-3">
              <Building className="w-4 h-4 text-primary" />
              <span>Current Affiliation: {profileData.currentAffiliation}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Availability */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Availability</h3>
        <div className="space-y-4">
          {profileData.availability && Object.entries(profileData.availability)
            .filter(([_, value]) => value)
            .map(([type]) => (
              <div key={type} className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-primary" />
                <span className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))
          }
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Profile Header */}
        <Card className="overflow-hidden border-none shadow-sm">
          <div className="relative">
            <div className="absolute inset-0 h-32 bg-gradient-to-r from-primary/10 to-purple-500/10" />
            
            <div className="relative px-8 pt-20 pb-8">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                  <AvatarImage 
                    src={profileData.profilePicture || `${DEFAULT_PROFILE_IMAGE}?seed=${encodeURIComponent(profileData.fullName)}`} 
                  />
                  <AvatarFallback>{profileData.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold">{profileData.fullName[0].toUpperCase()+profileData.fullName.slice(1) }</h1>
                    {profileData.isVerified && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2 py-2">
                    {type === 'coach' ? `${profileData.primarySport} Coach` : profileData.primarySport}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-white">
                      {type === 'coach' ? profileData.coachingLevel : profileData.currentLevel}
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      {type === 'coach' ? profileData.yearsExperience : `${profileData.playingExperience} Years Experience`}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Basic Info */}
        <Card className="p-6 shadow-sm">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-primary" />
              <span>{profileData.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-primary" />
              <span>{profileData.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{profileData.address || profileData.nationality}</span>
            </div>
          </div>
        </Card>

        {/* Render specific details based on type */}
        {type === 'player' ? (
        
            renderPlayerDetails()
           
        
        ) : renderCoachDetails()}
      </div>
    </div>
  );
};

export default ProfilePage; 