import { Trophy, Users, ShoppingBag, Dumbbell, Target, MessageSquare } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: <Trophy className="h-10 w-10" />,
      title: "Career Development",
      description: "Get personalized guidance for your athletic career path",
    },
    {
      icon: <Users className="h-10 w-10" />,
      title: "Expert Coaching",
      description: "Connect with certified coaches and mentors",
    },
    {
      icon: <ShoppingBag className="h-10 w-10" />,
      title: "Talent Marketplace",
      description: "Showcase your skills to recruiters and teams",
    },
    {
      icon: <Dumbbell className="h-10 w-10" />,
      title: "Training Programs",
      description: "Access customized training plans and workouts",
    },
    {
      icon: <Target className="h-10 w-10" />,
      title: "Goal Tracking",
      description: "Set and monitor your athletic objectives",
    },
    {
      icon: <MessageSquare className="h-10 w-10" />,
      title: "Direct Communication",
      description: "Chat directly with coaches and recruiters",
    },
  ]

  return (
    (<section className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6 mx-auto">
        <div
          className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl" data-aos="zoom-in" data-aos-duration="1000">Platform Features</h2>
            <p
              className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed" data-aos="zoom-in" data-aos-duration="1000">
              Everything you need to succeed in your athletic career
            </p>
          </div>
        </div>
        <div
          className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center space-y-4 p-6 border rounded-lg" data-aos="zoom-in" data-aos-duration="1000">
              <div className="p-3 rounded-full bg-primary/10 text-primary">{feature.icon}</div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-center text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>)
  );
}

