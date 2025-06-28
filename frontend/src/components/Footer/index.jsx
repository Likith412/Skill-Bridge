import { Link } from "react-router-dom";
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaInstagram,
  FaEnvelope,
  FaPhone,
} from "react-icons/fa";

import "./index.css";

function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container container">
        <div className="footer-row">
          <div className="footer-col footer-brand">
            <div className="footer-logo">
              <h3 className="footer-logo-text">SB</h3>
            </div>
            <h5 className="footer-title">Skill Bridge</h5>
            <p className="footer-desc">
              Connects clients with skilled students through client-created
              projects, enabling students to gain hands-on experience while
              helping clients bring their ideas to life.
            </p>
          </div>
          <div className="footer-col">
            <h5 className="footer-title">Quick Links</h5>
            <ul className="footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms">Terms of Service</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h5 className="footer-title">Contact & Social</h5>
            <p>
              <FaEnvelope style={{ marginRight: "8px", color: "#0077ff" }} />
              <a
                href="mailto:skill-bridge@gmail.com"
                className="footer-contact-link footer-mail"
              >
                skill-bridge@gmail.com
              </a>
            </p>
            <p>
              <FaPhone style={{ marginRight: "8px", color: "#43b581" }} />
              <a
                href="tel:+1234567890"
                className="footer-contact-link footer-phone"
              >
                +1 234 567 890
              </a>
            </p>
            <div className="footer-social">
              <a
                href="https://github.com/Likith412"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGithub />
              </a>
              <a
                href="https://linkedin.com/in/yourprofile"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin />
              </a>
              <a
                href="https://twitter.com/"
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaTwitter />
              </a>
              <a
                href="https://instagram.com/"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
