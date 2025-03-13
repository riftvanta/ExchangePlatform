import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
    const { user } = useAuth();

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="profile-page">
            <h2>User Profile</h2>
            <div className="profile-info">
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
        </div>
    );
};

export default ProfilePage;
