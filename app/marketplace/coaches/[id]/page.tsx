"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { RequestCoachingDialog } from "@/components/marketplace/RequestCoachingDialog";
import { createClient } from "@/lib/supabase/client";
import {
  Star,
  CheckCircle,
  MapPin,
  DollarSign,
  Calendar,
  Award,
  MessageCircle,
  Globe,
  Linkedin,
  ArrowLeft,
  Languages,
  Clock,
  Target,
  Video,
} from "lucide-react";
import Link from "next/link";

interface CoachProfile {
  id: string;
  user_id: string;
  display_name: string;
  tagline: string;
  bio: string;
  avatar_url: string;
  cover_image_url: string;
  specializations: string[];
  languages: string[];
  certifications: string[];
  years_experience: number;
  session_rate: number;
  currency: string;
  availability_status: string;
  timezone: string;
  video_intro_url: string;
  linkedin_url: string;
  website_url: string;
  total_sessions: number;
  average_rating: number;
  total_reviews: number;
  is_verified: boolean;
  is_featured: boolean;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  would_recommend: boolean;
  is_verified_session: boolean;
  created_at: string;
  client_id: string;
}

export default function CoachProfilePage() {
  const params = useParams();
  const router = useRouter();
  const coachId = params.id as string;

  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCoachProfile();
  }, [coachId]);

  async function loadCoachProfile() {
    setIsLoading(true);
    const supabase = createClient();

    // ✅ Primero intentar buscar por user_id (desde client dashboard)
    let profileRes = await supabase
      .from("coach_profiles")
      .select("*")
      .eq("user_id", coachId)
      .eq("is_public", true)
      .maybeSingle();

    // ✅ Si no encuentra, buscar por id (desde marketplace)
    if (!profileRes.data) {
      profileRes = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("id", coachId)
        .eq("is_public", true)
        .maybeSingle();
    }

    const reviewsRes = await supabase
      .from("coach_reviews")
      .select("*")
      .eq("coach_profile_id", profileRes.data?.id || coachId)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (profileRes.data) {
      setCoach(profileRes.data);
    }

    if (reviewsRes.data) {
      setReviews(reviewsRes.data);
    }

    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading coach profile...</p>
        </div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Coach Not Found</h2>
          <p className="text-muted-foreground mb-4">
            This coach profile doesn't exist or is not public
          </p>
          <Link href="/marketplace">
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const initials = coach.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const availabilityConfig = {
    available: { label: "Available Now", color: "bg-green-100 text-green-800 border-green-200" },
    busy: { label: "Limited Availability", color: "bg-amber-100 text-amber-800 border-amber-200" },
    not_accepting: {
      label: "Not Accepting Clients",
      color: "bg-slate-100 text-slate-800 border-slate-200",
    },
  };

  const availability = availabilityConfig[coach.availability_status as keyof typeof availabilityConfig];

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    percentage: reviews.length > 0
      ? Math.round((reviews.filter((r) => r.rating === stars).length / reviews.length) * 100)
      : 0,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {coach.cover_image_url ? (
        <div
          className="h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${coach.cover_image_url})` }}
        />
      ) : (
        <div className="h-64 bg-gradient-to-r from-blue-600 to-purple-600" />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4 bg-white/90 backdrop-blur hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-6">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={coach.avatar_url} alt={coach.display_name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                          {coach.display_name}
                          {coach.is_verified && (
                            <CheckCircle className="h-6 w-6 text-blue-600" />
                          )}
                        </h1>
                        <p className="text-lg text-muted-foreground mt-1">{coach.tagline}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      {coach.average_rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-lg">{coach.average_rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">
                            ({coach.total_reviews} reviews)
                          </span>
                        </div>
                      )}

                      {coach.total_sessions > 0 && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-muted-foreground">
                            {coach.total_sessions} sessions completed
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {coach.is_featured && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                          Featured
                        </Badge>
                      )}
                      <Badge variant="outline" className={availability.color}>
                        <Calendar className="h-3 w-3 mr-1" />
                        {availability.label}
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {coach.years_experience}+ years experience
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {coach.video_intro_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Introduction Video
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                    <iframe
                      src={coach.video_intro_url}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {coach.bio || "No bio provided yet."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Specializations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {coach.specializations.map((spec, index) => (
                    <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {coach.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certifications & Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {coach.certifications.map((cert, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Client Reviews ({coach.total_reviews})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    {ratingDistribution.map((dist) => (
                      <div key={dist.stars} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-12">
                          {dist.stars} stars
                        </span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400"
                            style={{ width: `${dist.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {dist.count}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              ))}
                            </div>
                            {review.is_verified_session && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-1">{review.title}</h4>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        {review.would_recommend && (
                          <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Would recommend this coach
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-4">
              <CardContent className="pt-6 space-y-4">
                <div className="text-center border-b pb-4">
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                    <span className="text-4xl font-bold">{coach.session_rate}</span>
                    <span className="text-muted-foreground">/{coach.currency}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">per session</p>
                </div>

                <RequestCoachingDialog
                  coachId={coach.user_id}
                  coachProfileId={coach.id}
                  coachName={coach.display_name}
                  trigger={
                    <Button className="w-full" size="lg" disabled={coach.availability_status === "not_accepting"}>
                      Request Coaching
                    </Button>
                  }
                />

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Languages:</span>
                    <span className="text-muted-foreground">{coach.languages.join(", ")}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Timezone:</span>
                    <span className="text-muted-foreground">{coach.timezone}</span>
                  </div>

                  {coach.website_url && (
                    <a
                      href={coach.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      <span>Visit Website</span>
                    </a>
                  )}

                  {coach.linkedin_url && (
                    <a
                      href={coach.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span>LinkedIn Profile</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
