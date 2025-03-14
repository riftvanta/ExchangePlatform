import LoginForm from '../components/LoginForm';

function LoginPage() {
  return (
    <div className="login-page">
      <div className="app-logo">
        <h1>
          <i className="fa-solid fa-exchange-alt"></i> USDT-JOD Exchange
        </h1>
        <p>Your secure platform for cryptocurrency exchange</p>
      </div>
      <LoginForm />
    </div>
  );
}

export default LoginPage; 