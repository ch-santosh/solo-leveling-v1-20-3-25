import Image from "next/image";

const About = () => {

  return (
    <div className="flex flex-col items-center justify-center px-4 sm:px-6 py-12 bg-gray-100">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-24 text-center">
        Developed By
      </h2>

      {/* Image Grid */}
      <div className="container grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto">
        <Image
          src="/hemanth.jpg"
          alt="Project Development"
          width={400}
          height={300}
          className="rounded-lg shadow-md w-48 h-48 rounded-full"
          data-aos="flip-left"
          data-aos-duration="2000"
        />
        <Image
          src="/chukka.jpg"
          alt="Team Collaboration"
          width={400}
          height={300}
          className="rounded-lg shadow-md w-48 h-48 rounded-full"
          data-aos="flip-left"
          data-aos-duration="2000"
        />
        <Image
          src="/santosh.jpg"
          alt="Final Application"
          width={400}
          height={300}
          className="rounded-lg shadow-md w-48 h-48 rounded-full"
          data-aos="flip-left"
          data-aos-duration="2000"
        />
        <Image
          src="/Adhil.jpg"
          alt="Final Application"
          width={400}
          height={300}
          className="rounded-lg shadow-md w-48 h-48 rounded-full"
          data-aos="flip-left"
          data-aos-duration="2000"
        />
      </div>

      {/* Description */}
      <div className="mt-8 max-w-3xl text-center text-gray-700 px-4">
        <p className="text-base sm:text-lg leading-relaxed">
          We embarked on a journey to develop an innovative application,
          overcoming challenges through teamwork and dedication. From
          brainstorming ideas to final implementation, every step brought new
          learning experiences. Our application stands as a testament to our
          passion for technology and problem-solving.
        </p>
      </div>
    </div>
  );

};

export default About;
