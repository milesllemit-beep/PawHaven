import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="bg-[#faf6ee]">
      <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          <p class="text-sm font-semibold uppercase tracking-widest text-emerald-700">
            PawHaven Animal Rescue
          </p>
          <h1 class="mt-3 text-4xl font-bold leading-tight text-emerald-950 sm:text-5xl">
            Every Paw Deserves a Safe Home.
          </h1>
          <p class="mt-5 max-w-xl text-lg text-emerald-900/70">
            PawHaven connects adoptable animals with loving families. Browse animals looking for a
            home, apply to adopt, or report a stray so it gets the help it needs.
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <a
              routerLink="/animals"
              class="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Meet the Animals
            </a>
            <a
              routerLink="/reports/new"
              class="rounded-xl border border-emerald-700 bg-white px-6 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Report a Stray
            </a>
          </div>
        </div>

        <div class="overflow-hidden rounded-3xl shadow-xl">
          <img
            src="images/pawhaven-hero.jpg"
            alt="Two yellow Labrador Retriever puppies sitting together on the grass"
            class="h-auto w-full"
            width="1600"
            height="1200"
            loading="eager"
          />
        </div>
      </div>
    </section>

    <section class="bg-white">
      <div class="mx-auto max-w-4xl px-4 py-14 text-center">
        <h2 class="text-3xl font-bold text-emerald-950">About PawHaven</h2>
        <p class="mt-4 text-lg text-slate-600">
          We are an animal adoption platform built to make it easier for people to find a companion,
          for rescuers to list animals in need of a home, and for everyone to flag stray animals in
          their neighbourhood. Adoption applications are reviewed by our team so every match is a
          good one.
        </p>
      </div>
    </section>

    <section class="bg-[#eef3ea]">
      <div class="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <article class="rounded-2xl bg-white p-6 shadow-sm">
          <div class="text-3xl" aria-hidden="true">🐕</div>
          <h3 class="mt-4 text-xl font-semibold text-emerald-950">Find a Companion</h3>
          <p class="mt-2 text-sm text-slate-600">
            Browse dogs, cats, and other animals currently available for adoption, filter by what
            suits your home, and apply online.
          </p>
          <a
            routerLink="/animals"
            class="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Browse animals →
          </a>
        </article>

        <article class="rounded-2xl bg-white p-6 shadow-sm">
          <div class="text-3xl" aria-hidden="true">🆘</div>
          <h3 class="mt-4 text-xl font-semibold text-emerald-950">Help a Stray</h3>
          <p class="mt-2 text-sm text-slate-600">
            Spotted an animal in need? File a stray report with its location and details so it can
            be followed up.
          </p>
          <a
            routerLink="/reports/new"
            class="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Report a stray →
          </a>
        </article>

        <article class="rounded-2xl bg-white p-6 shadow-sm">
          <div class="text-3xl" aria-hidden="true">🤝</div>
          <h3 class="mt-4 text-xl font-semibold text-emerald-950">Support Rescuers</h3>
          <p class="mt-2 text-sm text-slate-600">
            Rescuers and shelters can create an account to list animals for adoption and keep track
            of incoming applications.
          </p>
          <a
            routerLink="/register"
            class="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Create an account →
          </a>
        </article>
      </div>
    </section>
  `,
})
export class HomeComponent {}
