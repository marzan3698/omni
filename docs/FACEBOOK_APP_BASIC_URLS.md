# Facebook App Basic Settings – সঠিক URL (ngrok)

আপনার Omni server এ public routes এই path এ আছে। Facebook এ **এই পুরো URL** ব্যবহার করুন।

## Base URL (ngrok)
```
https://journee-mechanomorphic-soledad.ngrok-free.dev
```

## Basic Settings এ দেবেন

| Facebook Field | সঠিক URL |
|----------------|-----------|
| **Privacy policy URL** | `https://journee-mechanomorphic-soledad.ngrok-free.dev/privacy-policy` |
| **Terms of Service URL** | `https://journee-mechanomorphic-soledad.ngrok-free.dev/terms-of-service` |
| **Data deletion instructions URL** | `https://journee-mechanomorphic-soledad.ngrok-free.dev/user-data-deletion` |

## ভুল (এগুলো ব্যবহার করবেন না)
- ~~/privacy~~ → use **/privacy-policy**
- ~~/terms~~ → use **/terms-of-service**
- ~~/data-deletion~~ → use **/user-data-deletion**

## Namespace
যদি "Already used by some other app" আসে, Namespace বদলে দিন, যেমন:
- `digimindpro`
- `digimind_crm`
- `omnicrm_paaera`
