const validator = require("validator");
const { parseJson } = require("../utils/parseJson");

// currentUserId can be used later if needed (e.g., during update)
function validateUserProfileInput(data, role) {
  let { studentProfile, clientProfile } = data;

  studentProfile = parseJson(studentProfile);
  clientProfile = parseJson(clientProfile);

  // === Validate Student Profile ===
  if (role === "student") {
    if (!studentProfile) {
      return { error: "Student profile is required" };
    }

    let { fullName, bio, skills, portfolioLinks, availability } = studentProfile;

    // Normalize fullName and bio
    fullName = fullName ? fullName.trim() : "";
    bio = bio ? bio.trim() : "";

    // Check for required fields
    if (!fullName || !bio || !skills || !portfolioLinks || !availability) {
      return { error: "Missing required fields in student profile" };
    }

    // Validate skills and portfolioLinks
    if (!Array.isArray(skills) || skills.length === 0) {
      return { error: "Skills must be a non-empty array" };
    }

    if (!Array.isArray(portfolioLinks) || portfolioLinks.length === 0) {
      return { error: "Portfolio links must be a non-empty array" };
    }

    const validAvailabilities = ["10hrs/week", "15hrs/week", "20hrs/week", "24hrs/week"];

    if (!validAvailabilities.includes(availability)) {
      return { error: "Invalid availability option provided" };
    }
  }

  // === Validate Client Profile ===
  if (role === "client") {
    if (!clientProfile) {
      return { error: "Client profile is required" };
    }

    let { orgName, orgDescription, socialLinks } = clientProfile;

    // Normalize orgName and orgDescription
    orgName = orgName ? orgName.trim() : "";
    orgDescription = orgDescription ? orgDescription.trim() : "";

    // Check for required fields
    if (!orgName || !orgDescription || !socialLinks) {
      return { error: "Missing required fields in client profile" };
    }

    // Validate socialLinks
    if (typeof socialLinks !== "object" || Array.isArray(socialLinks)) {
      return { error: "Social links must be a valid object" };
    }

    const { linkedin, twitter, website } = socialLinks;

    // Validate URLs
    if (linkedin && !validator.isURL(linkedin)) {
      return { error: "Invalid LinkedIn URL" };
    }

    if (twitter && !validator.isURL(twitter)) {
      return { error: "Invalid Twitter URL" };
    }

    if (website && !validator.isURL(website)) {
      return { error: "Invalid Website URL" };
    }

    // Normalize socialLinks to ensure consistent structure
    clientProfile.socialLinks = {
      linkedin: linkedin || "",
      twitter: twitter || "",
      website: website || "",
    };
  }

  // If all validations pass, return the validated profiles
  if (role === "student") {
    return {
      parsedStudentProfile: {
        fullName: studentProfile.fullName,
        skills: studentProfile.skills,
        bio: studentProfile.bio,
        portfolioLinks: studentProfile.portfolioLinks,
        availability: studentProfile.availability,
      },
      parsedClientProfile: null,
    };
  } else if (role === "client") {
    return {
      parsedStudentProfile: null,
      parsedClientProfile: {
        orgName: clientProfile.orgName,
        orgDescription: clientProfile.orgDescription,
        socialLinks: clientProfile.socialLinks,
      },
    };
  }
}

module.exports = { validateUserProfileInput };
