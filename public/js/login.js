/* eslint-disable */
import { showAlert } from './alert';

export const login = async (obj) => {
  try {
    let res = await fetch('/api/v1/users/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: obj.email,
        password: obj.password,
      }),
    });
    res = await res.json();
    console.log(res);

    if (res.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    } else {
      throw err;
    }
  } catch (err) {
    // console.log('hi');
    showAlert('error', 'Please provide valid email or password');
  }
};

export const logout = async () => {
  try {
    let res = await fetch('/api/v1/users/logout');
    console.log(res);

    if (res.status === 200) {
      location.reload(true);
    }
  } catch (err) {
    // console.log(err);
    showAlert('error', 'Error Logging out.');
  }
};
