import React, { useState } from 'react';
import SavedAddressesManager from '../components/SavedAddressesManager';
import { SectionContainer } from '../components/ui';

interface ProfileTab {
  id: string;
  label: string;
}

const ProfileSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('general');

  const tabs: ProfileTab[] = [
    { id: 'general', label: 'General Information' },
    { id: 'security', label: 'Security Settings' },
    { id: 'addresses', label: 'Saved Addresses' },
    { id: 'notifications', label: 'Notifications' },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <SectionContainer className="profile-settings-container">
      <h1 className="profile-title">Profile Settings</h1>
      
      <div className="profile-content">
        <div className="profile-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="profile-tab-content">
          {activeTab === 'general' && (
            <div className="tab-panel">
              <h2 className="tab-title">General Information</h2>
              <p>Update your basic profile information here.</p>
              
              <div className="profile-form">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    className="form-input"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="john.doe@example.com"
                    disabled
                  />
                  <small>Email cannot be changed. Contact support for assistance.</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    className="form-input"
                    placeholder="+1 (234) 567-8900"
                  />
                </div>
                
                <button className="save-profile-btn">Save Changes</button>
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="tab-panel">
              <h2 className="tab-title">Security Settings</h2>
              <p>Manage your account security settings.</p>
              
              <div className="profile-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    className="form-input"
                    placeholder="Enter your current password"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    className="form-input"
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className="form-input"
                    placeholder="Confirm new password"
                  />
                </div>
                
                <button className="save-profile-btn">Update Password</button>
              </div>
              
              <div className="security-options">
                <h3>Additional Security Options</h3>
                
                <div className="security-option">
                  <div className="option-details">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account.</p>
                  </div>
                  <button className="setup-2fa-btn">Set Up 2FA</button>
                </div>
                
                <div className="security-option">
                  <div className="option-details">
                    <h4>Login History</h4>
                    <p>Review your recent login activity.</p>
                  </div>
                  <button className="view-history-btn">View History</button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'addresses' && (
            <div className="tab-panel">
              <h2 className="tab-title">Saved Withdrawal Addresses</h2>
              <p>Manage your saved TRC20 addresses for quicker USDT withdrawals.</p>
              
              <SavedAddressesManager />
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="tab-panel">
              <h2 className="tab-title">Notification Preferences</h2>
              <p>Customize how you receive notifications.</p>
              
              <div className="notification-settings">
                <div className="notification-option">
                  <div className="option-info">
                    <h4>Email Notifications</h4>
                    <p>Receive important updates via email.</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div className="notification-option">
                  <div className="option-info">
                    <h4>Withdrawal Confirmations</h4>
                    <p>Get notified when your withdrawals are processed.</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div className="notification-option">
                  <div className="option-info">
                    <h4>Login Alerts</h4>
                    <p>Receive alerts for new login attempts.</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div className="notification-option">
                  <div className="option-info">
                    <h4>Marketing Communications</h4>
                    <p>Receive news and special offers.</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <button className="save-profile-btn">Save Preferences</button>
            </div>
          )}
        </div>
      </div>
    </SectionContainer>
  );
};

export default ProfileSettingsPage; 