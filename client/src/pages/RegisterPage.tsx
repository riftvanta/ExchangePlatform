import RegisterForm from '../components/RegisterForm';

function RegisterPage() {
  return (
    <div className="register-page">
      <div className="app-logo">
        <h1>
          <i className="fa-solid fa-exchange-alt"></i> USDT-JOD Exchange
        </h1>
        <p>Your secure platform for cryptocurrency exchange</p>
      </div>
      <RegisterForm />
    </div>
  );
}

export default RegisterPage; 