import React from 'react';
import { Link } from 'react-router-dom';

import styles from './styles.css';

function Login() {
    return (
        <div className={styles.login}>
            <div className={styles.loginFormContainer}>
                <h2>
                    Login
                </h2>
                <form className={styles.loginForm}>
                    <input
                        type="text"
                        // autoFocus
                        name="username"
                        required
                        placeholder="Username"
                    />
                    <input
                        type="password"
                        name="password"
                        required
                        placeholder="Password"
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        required
                        placeholder="Confirm Password"
                    />
                    <div className={styles.actionButtons}>
                        <Link
                            className={styles.forgotPasswordLink}
                            to="/password-reset/"
                        >
                            Forgot password?
                        </Link>
                        <button
                            type="submit"
                        >
                            Login
                        </button>
                    </div>
                </form>
                <div className={styles.registerLinkContainer}>
                    <p>
                        No account yet?
                    </p>
                    <Link
                        className={styles.registerLink}
                        // FIXME: use from routes
                        to="/register/"
                    >
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
