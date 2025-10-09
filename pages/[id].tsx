import * as React from "react";
import type { GetServerSideProps } from "next";
import { inventory, type Vehicle, PLACEHOLDER_IMG } from "../data/inventory";

type Props = { vehicle: Vehicle };

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { id } = params as { id: string };
  const vehicle = inventory.find(v => v.id === id) || null;
  if (!vehicle) return { notFound: true };
  return { props: { vehicle } };
};

export default function VehiclePage({ vehicle }: Props) {
  const photo = vehicle.photos?.[0] || PLACEHOLDER_IMG;
  return (
    <main style={{minHeight:'100vh',background:'#111',color:'#fff',padding:'24px'}}>
      <a href="/" style={{display:'inline-block',marginBottom:16}}>← Back</a>
      <h1 style={{fontSize:24,fontWeight:700}}>{vehicle.title}</h1>
      <p style={{opacity:.8}}>
        {vehicle.year} · {vehicle.make} {vehicle.model} · {vehicle.mileage.toLocaleString()} mi
      </p>
      <div style={{marginTop:16}}>
        <img src={photo} alt={vehicle.title} style={{maxWidth:'100%',borderRadius:12}} />
      </div>
    </main>
  );
}
