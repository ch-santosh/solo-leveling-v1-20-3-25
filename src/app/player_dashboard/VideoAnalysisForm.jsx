import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Upload,
  Video,
  CheckCircle,
  XCircle,
  Award,
  Dumbbell,
  Target,
  ArrowUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const VideoAnalysisForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [playerPosition, setPlayerPosition] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check if file is a video
      if (!selectedFile.type.startsWith("video/")) {
        toast.error("Please upload a video file");
        return;
      }

      // Check file size (limit to 100MB)
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error("File size exceeds 100MB limit");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a video file");
      return;
    }

    if (!playerPosition) {
      toast.error("Please select a player position");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("player_position", playerPosition);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          setIsSubmitting(false);

          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            setAnalysisResult(response);
            setIsDialogOpen(true);
            toast.success("Video analysis completed successfully!");
          } else {
            toast.error("Failed to analyze video. Please try again.");
          }
        }
      };

      xhr.open("POST", "http://127.0.0.1:8000/analyze-video-direct/", true);
      xhr.send(formData);
    } catch (error) {
      console.error("Error analyzing video:", error);
      toast.error("Failed to analyze video. Please try again.");
      setIsSubmitting(false);
    }
  };

  const renderPotentialRating = (rating) => {
    const maxRating = 10;
    const filledStars = Math.round(rating);

    return (
      <div className="flex items-center gap-2">
        <div className="flex">
          {[...Array(maxRating)].map((_, i) => (
            <Award
              key={i}
              className={`w-5 h-5 ${
                i < filledStars
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="font-bold text-lg">{rating}/10</span>
      </div>
    );
  };

  return (
    <>
      <Card className="p-6 mt-6">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            <CardTitle>Video Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <p className="text-muted-foreground mb-6">
            Upload a video of your gameplay to receive AI-powered analysis and
            improvement suggestions.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="playerPosition">Player Position</Label>
                <Select
                  value={playerPosition}
                  onValueChange={setPlayerPosition}
                >
                  <SelectTrigger id="playerPosition">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Batsman">Batsman</SelectItem>
                    <SelectItem value="Bowler">Bowler</SelectItem>
                    <SelectItem value="All-rounder">All-rounder</SelectItem>
                    <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                    <SelectItem value="Defender">Defender</SelectItem>
                    <SelectItem value="Midfielder">Midfielder</SelectItem>
                    <SelectItem value="Forward">Forward</SelectItem>
                    <SelectItem value="Point Guard">Point Guard</SelectItem>
                    <SelectItem value="Shooting Guard">
                      Shooting Guard
                    </SelectItem>
                    <SelectItem value="Small Forward">Small Forward</SelectItem>
                    <SelectItem value="Power Forward">Power Forward</SelectItem>
                    <SelectItem value="Center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="videoFile">Upload Video</Label>
                <div className="mt-1">
                  <label
                    htmlFor="videoFile"
                    className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="w-6 h-6 text-primary" />
                      <span className="font-medium text-sm text-gray-600">
                        {file
                          ? file.name
                          : "Drop files here or click to upload"}
                      </span>
                      <span className="text-xs text-gray-500">
                        MP4, MOV, AVI up to 100MB
                      </span>
                    </div>
                    <input
                      id="videoFile"
                      type="file"
                      className="hidden"
                      accept="video/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            </div>

            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Uploading video...
                  </span>
                  <span className="text-sm font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={isSubmitting || !file || !playerPosition}
            >
              {isSubmitting ? "Analyzing..." : "Analyze Video"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Video Analysis Results
            </DialogTitle>
          </DialogHeader>

          {analysisResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Sport</p>
                  <p className="text-lg font-medium">{analysisResult.sport}</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="text-lg font-medium">
                    {analysisResult.player_position}
                  </p>
                </div>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Video Duration
                  </p>
                  <p className="text-lg font-medium">
                    {analysisResult.video_properties.duration_seconds.toFixed(
                      2
                    )}
                    s
                  </p>
                </div>
              </div>

              <Tabs defaultValue="summary">
                <TabsList className="w-full">
                  <TabsTrigger value="summary" className="flex-1">
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="technique" className="flex-1">
                    Technique
                  </TabsTrigger>
                  <TabsTrigger value="strengths" className="flex-1">
                    Strengths & Weaknesses
                  </TabsTrigger>
                  <TabsTrigger value="improvements" className="flex-1">
                    Improvements
                  </TabsTrigger>
                  <TabsTrigger value="raw" className="flex-1">
                    Full Analysis
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-4 space-y-4">
                  <div className="bg-primary/5 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Final Verdict</h3>
                      <Badge
                        variant={
                          analysisResult.final_verdict.is_good_player
                            ? "default"
                            : "secondary"
                        }
                      >
                        {analysisResult.final_verdict.development_stage}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Potential Rating
                        </p>
                        {renderPotentialRating(
                          analysisResult.final_verdict.potential_rating
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Reasoning
                        </p>
                        <p>{analysisResult.final_verdict.reasoning}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Recommendation
                        </p>
                        <p className="font-medium">
                          {analysisResult.final_verdict.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="technique" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-primary/5 p-6 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Technique Assessment</h3>
                      </div>
                      <p>{analysisResult.technique_assessment}</p>
                    </div>

                    <div className="bg-primary/5 p-6 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Dumbbell className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Fitness Assessment</h3>
                      </div>
                      <p>{analysisResult.fitness_assessment}</p>
                    </div>
                  </div>

                  <div className="bg-primary/5 p-6 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Video className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">
                        Camera Angle Suggestions
                      </h3>
                    </div>
                    <p>{analysisResult.camera_angle_suggestions}</p>
                  </div>
                </TabsContent>

                <TabsContent value="strengths" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-green-700">
                          Strengths
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {analysisResult.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <ArrowUp className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-50 p-6 rounded-lg border border-red-100">
                      <div className="flex items-center gap-2 mb-4">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <h3 className="font-semibold text-red-700">
                          Weaknesses
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {analysisResult.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="improvements" className="mt-4">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-700">
                        Improvement Suggestions
                      </h3>
                    </div>
                    <ul className="space-y-3">
                      {analysisResult.improvement_suggestions.map(
                        (suggestion, index) => (
                          <li
                            key={index}
                            className="bg-white p-3 rounded-md shadow-sm"
                          >
                            {suggestion}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="raw" className="mt-4">
                  <div className="bg-gray-50 p-6 rounded-lg border">
                    <div className="prose max-w-none">
                      <ReactMarkdown>
                        {analysisResult.raw_assessment}
                      </ReactMarkdown>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideoAnalysisForm;
