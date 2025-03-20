"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Filter, Search, Trophy, Medal, 
  Activity, Target, MapPin, Clock,
  CheckCircle, Star, Dumbbell, Heart
} from "lucide-react";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { toast } from "sonner";

const DEFAULT_PROFILE_IMAGE = "https://api.dicebear.com/7.x/initials/svg";

const MarketplacePage = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    sport: "",
    location: "",
    experience: "",
    verified: true
  });

  useEffect(() => {
    fetchVerifiedPlayers();
  }, []);

  const fetchVerifiedPlayers = async () => {
    try {
      const playersRef = collection(db, "players");
      const q = query(playersRef, where("status", "==", "active"));
      const querySnapshot = await getDocs(q);
      
      const verifiedPlayers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPlayers(verifiedPlayers);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  const handleLikePlayer = async (player) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) {
        toast.error("Please login first");
        return;
      }

      // Check if user is a coach
      if (!userData.coachingLevel) {
        toast.error("Only coaches can show interest in players");
        return;
      }

      // Add request to player's marketplaceRequests
      const playerRef = doc(db, "players", player.email);
      await updateDoc(playerRef, {
        marketplaceRequests: arrayUnion({
          coachId: userData.email,
          coachName: userData.fullName,
          status: 'pending',
          date: new Date().toISOString()
        })
      });

      // Add player to coach's interestedPlayers array
      const coachRef = doc(db, "coaches", userData.email);
      await updateDoc(coachRef, {
        interestedPlayers: arrayUnion({
          playerId: player.email,
          playerName: player.fullName,
          status: 'pending',
          date: new Date().toISOString()
        })
      });

      // Fetch updated coach data and update localStorage
      const updatedCoachSnap = await getDoc(coachRef);
      if (updatedCoachSnap.exists()) {
        const updatedCoachData = updatedCoachSnap.data();
        localStorage.setItem('user', JSON.stringify(updatedCoachData));
      }

      // Update local state to reflect changes immediately
      setPlayers(prev => 
        prev.map(p => 
          p.email === player.email 
            ? {
                ...p,
                marketplaceRequests: [...(p.marketplaceRequests || []), {
                  coachId: userData.email,
                  coachName: userData.fullName,
                  status: 'pending',
                  date: new Date().toISOString()
                }]
              }
            : p
        )
      );

      toast.success("Interest shown successfully!");
    } catch (error) {
      console.error("Error showing interest:", error);
      toast.error("Failed to show interest");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 text-transparent bg-clip-text">
            Discover Elite Athletes
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with verified athletes and find the perfect talent for your team
          </p>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto mb-12">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search athletes..." 
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <Select
                value={filters.sport}
                onValueChange={(value) => setFilters(prev => ({ ...prev, sport: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="football">Football</SelectItem>
                  <SelectItem value="cricket">Cricket</SelectItem>
                  <SelectItem value="basketball">Basketball</SelectItem>
                  <SelectItem value="tennis">Tennis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:w-auto">
                  <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Athletes</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <Input placeholder="Location" />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Experience Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2">
                    <Switch id="verified" />
                    <Label htmlFor="verified">Verified Athletes Only</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Sprint Speed (seconds)</Label>
                    <Slider
                      defaultValue={[0]}
                      max={15}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Athletes Grid */}
        {loading ? (
          <div className="text-center py-12">Loading athletes...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {players.map((player) => (
              <div 
                key={player.id} 
                className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                {/* Top Banner */}
                <div className="absolute inset-x-0 h-24 bg-gradient-to-r from-primary/10 to-purple-500/10" />
                
                {/* Content */}
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {player.profilePicture ? (
                        <img 
                          src={player.profilePicture} 
                          alt={player.fullName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                          onError={(e) => {
                            e.target.src = `${DEFAULT_PROFILE_IMAGE}?seed=${encodeURIComponent(player.fullName)}`;
                          }}
                        />
                      ) : (
                        <img 
                          src={`${DEFAULT_PROFILE_IMAGE}?seed=${encodeURIComponent(player.fullName)}`}
                          alt={player.fullName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {player.fullName}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-primary/10">
                            {player.primarySport}
                          </Badge>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span>{player.currentLevel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{player.playingExperience} years</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Dumbbell className="w-4 h-4 text-primary" />
                        <span>{player.height}cm • {player.weight}kg</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{player.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Achievements */}
                  {player.achievements && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Medal className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Achievements</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {player.achievements}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                      onClick={() => {
                        const encodedEmail = encodeURIComponent(player.email);
                        window.location.href = `/profile/player/${encodedEmail}`;
                      }}
                    >
                      View Profile
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleLikePlayer(player)}
                      disabled={
                        !JSON.parse(localStorage.getItem('user'))?.coachingLevel ||
                        player.marketplaceRequests?.some(req => req.coachId === JSON.parse(localStorage.getItem('user'))?.email)
                      }
                      className={player.marketplaceRequests?.some(req => req.coachId === JSON.parse(localStorage.getItem('user'))?.email) ? "bg-primary/10" : ""}
                    >
                      {player.marketplaceRequests?.some(req => req.coachId === JSON.parse(localStorage.getItem('user'))?.email) ? (
                        <>
                          <Heart className="w-4 h-4 mr-2 fill-primary" />
                          Interested
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-2" />
                          Show Interest
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
