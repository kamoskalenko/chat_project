import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import axios from "axios";
import * as Yup from "yup";
import s from "./LoginForm.module.css";
import API from "../../API.jsx";

const LoginForm = () => {
  const navigate = useNavigate();

  const initialValues = { email: "", password: "" };

  const validationSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email format").required("Required"),
    password: Yup.string().min(6, "Minimum 6 characters").required("Required"),
  });

  const handleSubmit = async (values, options) => {
    try {
      const response = await axios.post(`${API}/login`, values);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        options.resetForm();
        navigate("/chats"); // Redirect to chat after successful login
      } else {
        alert("Invalid email or password");
      }
    } catch (error) {
      alert("Invalid email or password");
    }
  };

  return (
    <div className={s.container}>
      <h2 className={s.title}>Sign In</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        <Form className={s.form}>
          <div className={s.fieldWrapper}>
            <label htmlFor="email" className={s.label}>
              Email
            </label>
            <Field name="email" type="email" className={s.input} id="email" />
            <ErrorMessage
              name="email"
              component="div"
              className={s.errorMessage}
            />
          </div>

          <div className={s.fieldWrapper}>
            <label htmlFor="password" className={s.label}>
              Password
            </label>
            <Field
              name="password"
              type="password"
              className={s.input}
              id="password"
            />
            <ErrorMessage
              name="password"
              component="div"
              className={s.errorMessage}
            />
          </div>

          <button type="submit" className={s.button}>
            Sign In
          </button>
        </Form>
      </Formik>
    </div>
  );
};

export default LoginForm;
