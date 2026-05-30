import { KeyRound, LogIn, UserRound } from "lucide-react";
import { AuthFormCard, type AuthFormField } from "./auth-form-card";

export function LoginForm() {
  return (
    <AuthFormCard
      description="使用本地账号进入家庭仓储管理系统。"
      endpoint="/api/auth/login"
      fields={loginFields}
      pendingLabel="正在登录"
      submitLabel="登录"
      submitLeadingIcon={<LogIn aria-hidden size={16} />}
      title="登录"
    />
  );
}

const loginFields: AuthFormField[] = [
  {
    label: "用户名",
    leadingIcon: <UserRound aria-hidden size={16} />,
    name: "username",
    placeholder: "admin",
    required: true
  },
  {
    label: "密码",
    leadingIcon: <KeyRound aria-hidden size={16} />,
    name: "password",
    placeholder: "输入密码",
    required: true,
    type: "password"
  }
];
