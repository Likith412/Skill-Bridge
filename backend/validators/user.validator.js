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

    // Check for required fields. Social links are optional
    if (!orgName || !orgDescription) {
      return { error: "Missing required fields in client profile" };
    }

    // If socialLinks is provided, validate it
    if (socialLinks) {
      // Must be an object and not an array
      if (typeof socialLinks !== "object" || Array.isArray(socialLinks)) {
        return { error: "Social links must be a valid object" };
      }

      const allowedKeys = ["linkedin", "twitter", "website"];
      const keys = Object.keys(socialLinks);

      // Disallow any unexpected keys
      const hasInvalidKeys = keys.some(key => !allowedKeys.includes(key));
      if (hasInvalidKeys) {
        return { error: "Social links can only include linkedin, twitter, and website" };
      }

      // Prepare filtered & validated socialLinks
      const validSocialLinks = {};

      for (const key of allowedKeys) {
        const value = socialLinks[key];
        if (value && typeof value === "string") {
          if (!validator.isURL(value)) {
            return { error: `Invalid ${key} URL` };
          }

          // Store only valid URLs
          validSocialLinks[key] = value;
        }
      }

      // Store only if there is at least one valid non-empty entry
      if (Object.keys(validSocialLinks).length > 0) {
        clientProfile.socialLinks = validSocialLinks;
      }
    }
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
