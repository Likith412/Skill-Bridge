import React from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaTwitter, FaInstagram, FaEnvelope, FaPhone } from 'react-icons/fa';
import './footer.css';

function Footer() {
    return (
        <footer className="footer" role="contentinfo">
            <div className="footer-container container">
                <div className="footer-row">
                    <div className="footer-col">
                        <h5 className="footer-title">About Us</h5>
                        <p className="footer-desc">We are a team of passionate developers dedicated to building innovative solutions.</p>
                    </div>
                    <div className="footer-col">
                        <h5 className="footer-title">Quick Links</h5>
                        <ul className="footer-links">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/about">About</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                            <li><Link to="/privacy">Privacy Policy</Link></li>
                            <li><Link to="/terms">Terms of Service</Link></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h5 className="footer-title">Contact & Social</h5>
                        <p><FaEnvelope style={{marginRight: '8px', color: '#0077ff'}} /><a href="mailto:skill-bridge@gmail.com" style={{color: '#0077ff', fontWeight: 500}}>skill-bridge@gmail.com</a></p>
                        <p><FaPhone style={{marginRight: '8px', color: '#43b581'}} /><a href="tel:+1234567890" style={{color: '#43b581', fontWeight: 500}}>+1 234 567 890</a></p>
                        <div className="footer-social">
                            <a href="https://github.com/Likith412" aria-label="GitHub" target="_blank" rel="noopener noreferrer"><FaGithub /></a>
                            <a href="https://linkedin.com/in/yourprofile" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
                            <a href="https://twitter.com/" aria-label="Twitter" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
                            <a href="https://instagram.com/" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
                