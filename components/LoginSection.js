import { useSession, signIn, signOut } from "next-auth/react";

export default function LoginSection() {
  const { data: session } = useSession();

  console.log("user-data: ", session);

  if (session) {
    return (
      <>
        Signed in as {session.user.name} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
}
