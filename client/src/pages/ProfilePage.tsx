import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { SectionContainer } from '../components/ui';

const ProfilePage = () => {
    const { user } = useAuth();

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <SectionContainer className="profile-page">
            <div className="profile-header">
                <h1>User Profile</h1>
                <Link to="/profile/settings" className="settings-button">
                    Settings
                </Link>
            </div>
            <div className="profile-info">
                {(user.firstName || user.lastName) && (
                    <div className="profile-item">
                        <strong>Name:</strong>{' '}
                        {[user.firstName, user.lastName]
                            .filter(Boolean)
                            .join(' ') || 'Not provided'}
                    </div>
                )}
                <div className="profile-item">
                    <strong>Email:</strong> {user.email}
                </div>
                <div className="profile-item">
                    <strong>Registration Date:</strong>{' '}
                    {new Date(user.createdAt).toLocaleDateString()}
                </div>
                <div className="profile-item">
                    <strong>Two Factor Authentication:</strong>{' '}
                    {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </div>
            </div>
        </SectionContainer>
    );
};

export default ProfilePage;
