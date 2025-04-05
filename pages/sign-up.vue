<script lang="ts" setup>
import { signUp } from "~/lib/auth-client.js";

const firstName = ref("dsa");
const lastName = ref("dsa");
const email = ref("dsa@gmail.com");
const password = ref("dsaasd83");

const handleSignUp = async () => {
	const user = {
		firstName: firstName.value,
		lastName: lastName.value,
		email: email.value,
		password: password.value,
	};
	await signUp.email({
		email: user.email,
		password: user.password,
		name: `${user.firstName} ${user.lastName}`,
		callbackURL: "/",
		fetchOptions: {
			onError(context) {
				alert(context.error.message);
			},
			onSuccess() {
				useRouter().push("/dashboard");
			},
		},
	});
};
</script>

<template>
	<div class="h-screen flex justify-center items-center">
		<Card class="mx-auto max-w-sm">
			<CardHeader>
				<CardTitle class="text-xl">Sign Up</CardTitle>
				<CardDescription>
					Enter your information to create an account
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="grid gap-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="grid gap-2">
							<Label for="first-name">First name</Label>
							<Input id="first-name" v-model="firstName" placeholder="Max" required />
						</div>
						<div class="grid gap-2">
							<Label for="last-name">Last name</Label>
							<Input id="last-name" v-model="lastName" placeholder="Robinson" required />
						</div>
					</div>
					<div class="grid gap-2">
						<Label for="email">Email</Label>
						<Input id="email" v-model="email" type="email" placeholder="m@example.com" required />
					</div>
					<div class="grid gap-2">
						<Label for="password">Password</Label>
						<Input id="password" v-model="password" type="password" />
					</div>
					<Button type="button" class="w-full" @click="handleSignUp">Create an account</Button>
				</div>
				<div class="mt-4 text-center text-sm">
					Already have an account?
					<a href="/sign-in" class="underline"> Sign in </a>
				</div>
			</CardContent>
		</Card>
	</div>
</template>