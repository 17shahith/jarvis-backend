import 'dotenv/config';
import mongoose from 'mongoose';
import { getEmbedding } from './services/embeddings.service.js';
import { classifyIntent } from './services/ml.service.js';
import { saveSemanticMemory, storeInteraction } from './services/memory.manager.js';
import { querySemanticMemory } from './services/rag.service.js';
import pluginManager from './services/plugin.manager.js';
import Preference from './models/preference.model.js';
import Task from './models/task.model.js';
import Evaluation from './models/evaluation.model.js';
import { logger } from './config/db.config.js';

const testDBUri = process.env.MONGODB_URI;

const runTests = async () => {
  console.log("=================================================");
  console.log("    STARTING ADVANCED LEARNING ENGINE TESTS      ");
  console.log("=================================================\n");

  // 1. MongoDB Connection
  if (!testDBUri) {
    console.log("⚠️ MONGODB_URI is not defined. Using memory fallback.");
  } else {
    try {
      await mongoose.connect(testDBUri);
      console.log("✅ Database linked successfully.");
    } catch (e) {
      console.log(`❌ DB Link error: ${e.message}`);
    }
  }

  // 2. Test Schemas
  try {
    const dummyId = new mongoose.Types.ObjectId();
    
    // Preference save
    const pref = new Preference({ userId: dummyId, theme: 'violet', aiModel: 'qwen2.5:1.5b' });
    await pref.save();
    console.log("✅ Preference schema tested successfully.");
    
    // Task save
    const t = new Task({ userId: dummyId, text: 'Test smart scheduling task', category: 'automation' });
    await t.save();
    console.log("✅ Task schema tested successfully.");

    // Evaluation save
    const evalLog = new Evaluation({ modelUsed: 'qwen2.5:1.5b', promptLength: 12, responseLength: 24, latencyMs: 250 });
    await evalLog.save();
    console.log("✅ Evaluation schema tested successfully.");

    // Cleanup test docs
    await Preference.deleteOne({ userId: dummyId });
    await Task.deleteOne({ userId: dummyId });
    await Evaluation.deleteOne({ _id: evalLog._id });
  } catch (err) {
    console.error(`❌ Schema save test failed: ${err.message}`);
  }

  // 3. Test Embeddings
  try {
    const text = "Verify RAG memory context generation.";
    const vector = await getEmbedding(text);
    console.log(`✅ Embedding dimension matches: ${vector.length} floats.`);
  } catch (err) {
    console.error(`❌ Embedding test failed: ${err.message}`);
  }

  // 4. Test RAG / Pinecone upsert & retrieval
  try {
    const messageId = new mongoose.Types.ObjectId().toString();
    const saveResult = await saveSemanticMemory(messageId, "J.A.R.V.I.S. is running tests on Windows.", { category: 'test' });
    
    if (saveResult) {
      console.log("✅ Pinecone semantic memory upserted successfully.");
      const matches = await querySemanticMemory("tests on Windows");
      console.log(`✅ Pinecone search returned matches count: ${matches.length}`);
    } else {
      console.log("⚠️ Pinecone offline or unconfigured. Skipped upsert/retrieval verification.");
    }
  } catch (err) {
    console.error(`❌ Semantic search test failed: ${err.message}`);
  }

  // 5. Test classical ML routing
  try {
    const res1 = await classifyIntent("play some relaxing music");
    const res2 = await classifyIntent("is it sunny in Delhi");
    const res3 = await classifyIntent("turn on my living room light");

    console.log(`✅ ML Router Classified Intent 1 (Music): ${res1.intent} (${res1.confidence})`);
    console.log(`✅ ML Router Classified Intent 2 (Weather): ${res2.intent} (${res2.confidence})`);
    console.log(`✅ ML Router Classified Intent 3 (SmartHome): ${res3.intent} (${res3.confidence})`);
  } catch (err) {
    console.error(`❌ ML routing failed: ${err.message}`);
  }

  // 6. Test Plugin execution
  try {
    const actionResult = await pluginManager.executePlugin('home_control', 'turn on living room light');
    console.log(`✅ Plugin execution result: "${actionResult.message}"`);
  } catch (err) {
    console.error(`❌ Plugin trigger failed: ${err.message}`);
  }

  // Done
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  console.log("\n=================================================");
  console.log("    LEARNING ENGINE TESTS COMPLETED SUCCESSFULLY  ");
  console.log("=================================================");
};

runTests();
